import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Canteen from '../models/Canteen.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeStatus = (status = '') => String(status).toLowerCase().trim();

const generateOrderToken = () => {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${Date.now().toString().slice(-6)}-${randomPart}`;
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

    const token = generateOrderToken();

    const order = await Order.create({
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
