import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Canteen from '../models/Canteen.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const SLOT_WINDOW_MINUTES = 15;
const MAX_ORDERS_PER_SLOT = 20;

const normalizeStatus = (status = '') => String(status).toLowerCase().trim();

const computeCartTotal = (items) =>
  items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

const getOrCreateCart = async (userId) => {
  const existing = await Cart.findOne({ userId });
  if (existing) return existing;
  return Cart.create({ userId, canteenId: null, items: [], totalAmount: 0 });
};

const getSlotStart = (date) => {
  const slotStart = new Date(date);
  const minutes = slotStart.getMinutes();
  const roundedMinutes = Math.floor(minutes / SLOT_WINDOW_MINUTES) * SLOT_WINDOW_MINUTES;
  slotStart.setMinutes(roundedMinutes, 0, 0);
  return slotStart;
};

const getSlotBounds = (date) => {
  const slotStart = getSlotStart(date);
  const slotEnd = new Date(slotStart.getTime() + SLOT_WINDOW_MINUTES * 60 * 1000);
  return { slotStart, slotEnd };
};

const getOrderCountForSlot = async (canteenId, slotStart, slotEnd) => {
  return Order.countDocuments({
    canteenId,
    pickupTime: { $gte: slotStart, $lt: slotEnd },
    status: { $ne: 'cancelled' },
  });
};

const findNextAvailableSlot = async (canteenId, canteen, fromDate) => {
  const startSlot = getSlotStart(fromDate);

  for (let i = 1; i <= 96; i += 1) {
    const candidateStart = new Date(startSlot.getTime() + i * SLOT_WINDOW_MINUTES * 60 * 1000);
    const candidateEnd = new Date(candidateStart.getTime() + SLOT_WINDOW_MINUTES * 60 * 1000);

    if (!isPickupWithinOpenHours(candidateStart, canteen)) {
      continue;
    }

    const count = await getOrderCountForSlot(canteenId, candidateStart, candidateEnd);
    if (count < MAX_ORDERS_PER_SLOT) {
      return candidateStart;
    }
  }

  return null;
};

const getCanteenTokenPrefix = async (canteenId) => {
  const canteens = await Canteen.find({}, '_id').sort({ createdAt: 1, _id: 1 }).lean();
  const index = canteens.findIndex((canteen) => String(canteen._id) === String(canteenId));
  const numericCode = index >= 0 ? index + 1 : 0;
  return `C${numericCode}`;
};

const buildCanteenToken = (prefix, sequence) => `${prefix}-${String(sequence).padStart(5, '0')}`;

const getNextTokenCandidate = async (canteenId, attempt = 0) => {
  const [prefix, currentCount] = await Promise.all([
    getCanteenTokenPrefix(canteenId),
    Order.countDocuments({ canteenId }),
  ]);

  return buildCanteenToken(prefix, currentCount + 1 + attempt);
};

const isPickupWithinOpenHours = (pickupDate, canteen) => {
  const [openHour = '00', openMinute = '00'] = String(canteen.openTime || '00:00').split(':');
  const [closeHour = '23', closeMinute = '59'] = String(canteen.closeTime || '23:59').split(':');

  const pickupMinutes = pickupDate.getHours() * 60 + pickupDate.getMinutes();
  const openMinutes = Number(openHour) * 60 + Number(openMinute);
  const closeMinutes = Number(closeHour) * 60 + Number(closeMinute);

  return pickupMinutes >= openMinutes && pickupMinutes <= closeMinutes;
};

export const createOrder = async (req, res) => {
  try {
    const { pickupTime, notes = '' } = req.body;

    if (!pickupTime) {
      return res.status(400).json({ message: 'pickupTime is required' });
    }

    const pickupDate = new Date(pickupTime);
    if (Number.isNaN(pickupDate.getTime())) {
      return res.status(400).json({ message: 'pickupTime must be a valid datetime' });
    }

    const now = new Date();
    if (pickupDate <= now) {
      return res.status(400).json({ message: 'pickupTime must be in the future' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0 || !cart.canteenId) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const canteen = await Canteen.findById(cart.canteenId);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found for cart' });
    }

    if (!isPickupWithinOpenHours(pickupDate, canteen)) {
      return res.status(400).json({
        message: `Pickup time should be within canteen hours (${canteen.openTime} - ${canteen.closeTime})`,
      });
    }

    const { slotStart, slotEnd } = getSlotBounds(pickupDate);
    const slotOrderCount = await getOrderCountForSlot(cart.canteenId, slotStart, slotEnd);
    if (slotOrderCount >= MAX_ORDERS_PER_SLOT) {
      const suggestedSlot = await findNextAvailableSlot(cart.canteenId, canteen, pickupDate);
      return res.status(409).json({
        message: `Selected pickup slot is full (max ${MAX_ORDERS_PER_SLOT} orders per ${SLOT_WINDOW_MINUTES} minutes).`,
        slotWindowMinutes: SLOT_WINDOW_MINUTES,
        maxOrdersPerSlot: MAX_ORDERS_PER_SLOT,
        suggestedPickupTime: suggestedSlot ? suggestedSlot.toISOString() : null,
      });
    }

    // Refresh cart item prices/availability from current menu to avoid stale checkout totals.
    const menuItemIds = cart.items.map((item) => item.menuItemId);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, canteen: cart.canteenId });
    const menuById = new Map(menuItems.map((item) => [String(item._id), item]));

    const orderItems = [];

    for (const cartItem of cart.items) {
      const menuItem = menuById.get(String(cartItem.menuItemId));
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item is no longer available: ${cartItem.name}` });
      }
      if (!menuItem.available) {
        return res.status(400).json({ message: `Menu item out of stock: ${menuItem.name}` });
      }

      orderItems.push({
        name: menuItem.name,
        quantity: cartItem.quantity,
        price: menuItem.price,
      });
    }

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );

    let order = null;
    let lastError = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = await getNextTokenCandidate(cart.canteenId, attempt);

      const existing = await Order.findOne({ token }).select('_id');
      if (existing) {
        lastError = new Error('Token collision detected');
        continue;
      }

      try {
        order = await Order.create({
          canteenId: cart.canteenId,
          userId: req.user._id,
          items: orderItems,
          pickupTime: pickupDate,
          notes: String(notes || '').trim(),
          token,
          totalAmount,
          status: 'pending',
          statusHistory: [
            {
              status: 'pending',
              changedBy: req.user._id,
              reason: 'Order created by student',
            },
          ],
        });
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!order) {
      throw lastError || new Error('Failed to generate unique order token');
    }

    cart.items = [];
    cart.canteenId = null;
    cart.totalAmount = 0;
    await cart.save();

    const createdOrder = await Order.findById(order._id)
      .populate('canteenId', 'name openTime closeTime')
      .populate('userId', 'name email');

    return res.status(201).json(createdOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      filter.status = normalizedStatus;
    }

    const orders = await Order.find(filter)
      .populate('canteenId', 'name location')
      .sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId)
      .populate('canteenId', 'name location openTime closeTime')
      .populate('statusHistory.changedBy', 'name role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const cancelMyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled by students' });
    }

    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      changedBy: req.user._id,
      reason: 'Cancelled by student',
    });

    const updated = await order.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const reorderMyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { forceClear = false } = req.body || {};

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reorder this order' });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ message: 'This order has no items to reorder' });
    }

    const cart = await getOrCreateCart(req.user._id);

    if (
      cart.items.length > 0
      && cart.canteenId
      && String(cart.canteenId) !== String(order.canteenId)
      && !forceClear
    ) {
      return res.status(409).json({
        message: 'Cart is locked to another canteen. Clear cart to reorder these items.',
      });
    }

    if (forceClear) {
      cart.items = [];
      cart.totalAmount = 0;
      cart.canteenId = null;
    }

    const orderItemNames = order.items.map((item) => item.name);
    const availableMenuItems = await MenuItem.find({
      canteen: order.canteenId,
      name: { $in: orderItemNames },
      available: true,
    });

    const menuByName = new Map(
      availableMenuItems.map((item) => [item.name.trim().toLowerCase(), item])
    );

    const unavailableItems = [];

    for (const orderItem of order.items) {
      const key = orderItem.name.trim().toLowerCase();
      const menuItem = menuByName.get(key);

      if (!menuItem) {
        unavailableItems.push(orderItem.name);
        continue;
      }

      const existingIndex = cart.items.findIndex(
        (item) => String(item.menuItemId) === String(menuItem._id)
      );

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += Number(orderItem.quantity || 1);
        cart.items[existingIndex].price = Number(menuItem.price);
      } else {
        cart.items.push({
          menuItemId: menuItem._id,
          name: menuItem.name,
          image: menuItem.image || '',
          price: menuItem.price,
          quantity: Number(orderItem.quantity || 1),
        });
      }
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        message: 'No available items from this previous order can be re-added right now',
        unavailableItems,
      });
    }

    cart.canteenId = order.canteenId;
    cart.totalAmount = computeCartTotal(cart.items);

    const updated = await cart.save();

    return res.json({
      message: unavailableItems.length
        ? 'Re-order added with some unavailable items skipped'
        : 'Re-order items added to cart',
      unavailableItems,
      cart: {
        _id: updated._id,
        canteenId: updated.canteenId,
        items: updated.items,
        itemCount: updated.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        totalAmount: Number(updated.totalAmount || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
