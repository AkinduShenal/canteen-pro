import Order from '../../models/Order.js';
import {
  canAccessOrder,
  isValidObjectId,
  NEXT_STATUS_BY_CURRENT,
  normalizeStatus,
  STAFF_UPDATABLE_STATUSES,
} from './shared.js';

export const getStaffOrders = async (req, res) => {
  try {
    const { status, priorityOnly, canteenId, search } = req.query;

    const filter = {};

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      filter.canteenId = req.user.assignedCanteen;
    } else if (canteenId) {
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
      const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ token: regex }, { notes: regex }];
    }

    const orders = await Order.find(filter)
      .populate('canteenId', 'name location')
      .populate('userId', 'name email')
      .populate('statusHistory.changedBy', 'name role')
      .sort({ pickupTime: 1, createdAt: 1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
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

    const canAccess = await canAccessOrder(order, req.user);
    if (!canAccess) {
      return res.status(403).json({ message: 'You can only update orders of your assigned canteen' });
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

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bulkMarkOrdersReady = async (req, res) => {
  try {
    const { orderIds = [] } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'orderIds must be a non-empty array' });
    }

    const validIds = orderIds.filter((id) => isValidObjectId(id));
    if (validIds.length !== orderIds.length) {
      return res.status(400).json({ message: 'One or more order ids are invalid' });
    }

    const filter = {
      _id: { $in: validIds },
      status: { $in: ['accepted', 'preparing'] },
    };

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      filter.canteenId = req.user.assignedCanteen;
    }

    const orders = await Order.find(filter);

    for (const order of orders) {
      order.status = 'ready';
      order.statusHistory.push({
        status: 'ready',
        changedBy: req.user._id,
        reason: 'Bulk status update',
      });
      await order.save();
    }

    res.json({
      message: 'Orders updated to ready',
      updatedCount: orders.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
