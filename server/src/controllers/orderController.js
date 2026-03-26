import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Canteen from '../models/Canteen.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res) => {
  try {
    const { pickupTime, specialNotes } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    if (!pickupTime) {
      return res.status(400).json({ message: 'Pickup time is required' });
    }

    // Capacity Check (Max 20 orders per timeslot per canteen)
    const slotOrdersCount = await Order.countDocuments({
      canteenId: cart.canteen,
      pickupTime: pickupTime,
      status: { $nin: ['cancelled'] }
    });

    if (slotOrdersCount >= 20) {
      // Find next available slot after the requested one
      const allSlots = [];
      for (let h = 10; h <= 17; h++) {
        for (let m = 0; m < 60; m += 15) {
          let nextM = m + 15, nextH = h;
          if (nextM === 60) { nextM = 0; nextH = h + 1; }
          const start = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const end   = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
          allSlots.push(`${start} - ${end}`);
        }
      }
      const currentIdx = allSlots.indexOf(pickupTime);
      const futureSlots = currentIdx >= 0 ? allSlots.slice(currentIdx + 1) : allSlots;

      let nextAvailableSlot = null;
      for (const slot of futureSlots) {
        const count = await Order.countDocuments({
          canteenId: cart.canteen,
          pickupTime: slot,
          status: { $nin: ['cancelled'] }
        });
        if (count < 20) { nextAvailableSlot = slot; break; }
      }

      return res.status(400).json({ 
        message: 'This time slot is full (capacity reached). Please select a different time.',
        slotFull: true,
        nextAvailableSlot
      });
    }

    // Token Generation (e.g. C-00045)
    const canteen = await Canteen.findById(cart.canteen);
    const canteenPrefix = canteen ? canteen.name.substring(0, 2).toUpperCase() : 'CX';
    const totalCanteenOrders = await Order.countDocuments({ canteenId: cart.canteen });
    const orderSequence = String(totalCanteenOrders + 1).padStart(5, '0');
    const token = `${canteenPrefix}-${orderSequence}`;

    // Calculate total
    const totalAmount = cart.items.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);

    // Prepare embedded order items snapshot
    const orderItems = cart.items.map(item => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      quantity: item.quantity,
      price: item.menuItem.price
    }));

    const order = await Order.create({
      user: req.user._id,
      canteenId: cart.canteen,
      items: orderItems,
      pickupTime,
      specialNotes,
      totalAmount,
      orderToken: token,
      status: 'pending' // F5 default state
    });

    // Clear the cart
    cart.items = [];
    cart.canteen = null;
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('canteenId', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('canteenId', 'name');

    if (order && (order.user._id.toString() === req.user._id.toString() || req.user.role === 'staff' || req.user.role === 'admin')) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order (Student only when Pending)
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    order.status = 'cancelled';
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
