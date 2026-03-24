import Order from '../models/Order.js';
import {
  isValidObjectId,
  NEXT_STATUS_BY_CURRENT,
  normalizeStatus,
  STAFF_UPDATABLE_STATUSES,
} from './staffAdmin/shared.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getAdminOrders = async (req, res) => {
  try {
    const { status, priorityOnly, canteenId, search } = req.query;

    const filter = {};

    if (canteenId) {
      if (!isValidObjectId(canteenId)) {
        return res.status(400).json({ message: 'Invalid canteen id filter' });
      }
      filter.canteenId = canteenId;
    }

    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus) {
      filter.status = normalizedStatus;
    }

    if (priorityOnly === 'true') {
      filter.status = { $in: ['accepted', 'preparing'] };
    }

    const searchText = String(search || '').trim();
    if (searchText) {
      const regex = new RegExp(escapeRegex(searchText), 'i');
      filter.$or = [{ token: regex }, { notes: regex }];
    }

    const orders = await Order.find(filter)
      .populate('canteenId', 'name location')
      .populate('userId', 'name email')
      .populate('statusHistory.changedBy', 'name role')
      .sort({ pickupTime: 1, createdAt: 1 });

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, reason = '' } = req.body;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const nextStatus = normalizeStatus(status);
    if (!STAFF_UPDATABLE_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ message: 'Invalid status transition target' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const allowedNextStatuses = NEXT_STATUS_BY_CURRENT[order.status] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      return res.status(400).json({
        message: `Invalid transition from ${order.status} to ${nextStatus}`,
      });
    }

    order.status = nextStatus;
    order.statusHistory.push({
      status: nextStatus,
      changedBy: req.user._id,
      reason: reason.trim(),
    });

    const updatedOrder = await order.save();
    return res.json(updatedOrder);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
