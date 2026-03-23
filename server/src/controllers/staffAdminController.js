import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Canteen from '../models/Canteen.js';

const STAFF_UPDATABLE_STATUSES = ['accepted', 'preparing', 'ready', 'completed', 'cancelled'];
const NEXT_STATUS_BY_CURRENT = {
  pending: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeStatus = (status = '') => status.toLowerCase().trim();

const canAccessOrder = async (order, currentUser) => {
  if (currentUser.role === 'admin') return true;

  if (!currentUser.assignedCanteen) return false;

  return String(order.canteenId) === String(currentUser.assignedCanteen);
};

export const getDashboardMetrics = async (req, res) => {
  try {
    const baseMatch = {};

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      baseMatch.canteenId = req.user.assignedCanteen;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfRange = new Date(startOfToday);
    startOfRange.setDate(startOfRange.getDate() - 6);

    const endOfRange = new Date(startOfToday);
    endOfRange.setDate(endOfRange.getDate() + 1);

    const [summary] = await Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          preparing: {
            $sum: {
              $cond: [{ $in: ['$status', ['accepted', 'preparing']] }, 1, 0],
            },
          },
          ready: {
            $sum: {
              $cond: [{ $eq: ['$status', 'ready'] }, 1, 0],
            },
          },
          feedbackCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$feedback', null] },
                    { $ne: ['$feedback.isHidden', true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          averageRating: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$feedback', null] },
                    { $ne: ['$feedback.isHidden', true] },
                  ],
                },
                '$feedback.rating',
                null,
              ],
            },
          },
        },
      },
    ]);

    const chartRows = await Order.aggregate([
      {
        $match: {
          ...baseMatch,
          createdAt: {
            $gte: startOfRange,
            $lt: endOfRange,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$totalAmount', 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartMap = new Map(chartRows.map((row) => [row._id, row]));
    const labels = [];
    const ordersSeries = [];
    const revenueSeries = [];

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(startOfRange);
      day.setDate(startOfRange.getDate() + i);

      const key = day.toISOString().slice(0, 10);
      const row = chartMap.get(key);

      labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
      ordersSeries.push(row?.orders || 0);
      revenueSeries.push(Math.round(row?.revenue || 0));
    }

    const canteenStaffFilter = { role: 'staff' };
    if (req.user.role === 'staff') {
      canteenStaffFilter.assignedCanteen = req.user.assignedCanteen;
    }

    const canteenStaffCount = await User.countDocuments(canteenStaffFilter);

    res.json({
      stats: {
        totalOrders: summary?.totalOrders || 0,
        pending: summary?.pending || 0,
        preparing: summary?.preparing || 0,
        ready: summary?.ready || 0,
        feedbackCount: summary?.feedbackCount || 0,
        canteenStaffCount,
        averageRating: Number((summary?.averageRating || 0).toFixed(1)),
      },
      trends: {
        labels,
        ordersSeries,
        revenueSeries,
        totalRevenue: revenueSeries.reduce((sum, value) => sum + value, 0),
        lastUpdatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

export const createStaffAccount = async (req, res) => {
  try {
    const { name, email, password, assignedCanteen } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!assignedCanteen || !isValidObjectId(assignedCanteen)) {
      return res.status(400).json({ message: 'Valid assignedCanteen is required' });
    }

    const canteen = await Canteen.findById(assignedCanteen);
    if (!canteen) {
      return res.status(404).json({ message: 'Assigned canteen not found' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'staff',
      assignedCanteen,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedCanteen: user.assignedCanteen,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStaffAccounts = async (req, res) => {
  try {
    const staffUsers = await User.find({ role: 'staff' })
      .populate('assignedCanteen', 'name location')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(staffUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStaffAccount = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, password, assignedCanteen } = req.body;

    if (!isValidObjectId(staffId)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ message: 'Staff account not found' });
    }

    if (assignedCanteen) {
      if (!isValidObjectId(assignedCanteen)) {
        return res.status(400).json({ message: 'Invalid assigned canteen id' });
      }

      const canteen = await Canteen.findById(assignedCanteen);
      if (!canteen) {
        return res.status(404).json({ message: 'Assigned canteen not found' });
      }

      staffUser.assignedCanteen = assignedCanteen;
    }

    if (name) staffUser.name = name;
    if (email) staffUser.email = email;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      staffUser.password = password;
    }

    const updated = await staffUser.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      assignedCanteen: updated.assignedCanteen,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStaffAccount = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!isValidObjectId(staffId)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ message: 'Staff account not found' });
    }

    await User.deleteOne({ _id: staffUser._id });
    res.json({ message: 'Staff account removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFeedbackToCompletedOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment = '' } = req.body;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only review your own order' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ message: 'Feedback is allowed only for completed orders' });
    }

    if (order.feedback) {
      return res.status(400).json({ message: 'Feedback has already been submitted for this order' });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    order.feedback = {
      rating: parsedRating,
      comment: comment.trim(),
      submittedBy: req.user._id,
      isHidden: false,
    };

    await order.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: order.feedback,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeedbackList = async (req, res) => {
  try {
    const filter = { feedback: { $ne: null } };

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      filter.canteenId = req.user.assignedCanteen;
    }

    const orders = await Order.find(filter)
      .populate('canteenId', 'name')
      .populate('userId', 'name email')
      .sort({ 'feedback.createdAt': -1, createdAt: -1 });

    const feedbackList = orders.map((order) => ({
      orderId: order._id,
      canteen: order.canteenId,
      student: order.userId,
      status: order.status,
      pickupTime: order.pickupTime,
      token: order.token,
      feedback: order.feedback,
    }));

    res.json(feedbackList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const moderateFeedback = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(orderId);
    if (!order || !order.feedback) {
      return res.status(404).json({ message: 'Feedback not found for this order' });
    }

    order.feedback.isHidden = true;
    order.feedback.moderatedBy = req.user._id;
    order.feedback.moderatedAt = new Date();

    await order.save();

    res.json({ message: 'Feedback removed from public view' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBasicReports = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - 7);

    const [ordersTodayByCanteen, ordersThisWeekByCanteen, topSellingItems] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { _id: '$canteenId', totalOrders: { $sum: 1 } } },
        {
          $lookup: {
            from: 'canteens',
            localField: '_id',
            foreignField: '_id',
            as: 'canteen',
          },
        },
        { $unwind: { path: '$canteen', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            canteenId: '$_id',
            canteenName: { $ifNull: ['$canteen.name', 'Unknown Canteen'] },
            totalOrders: 1,
          },
        },
        { $sort: { totalOrders: -1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        { $group: { _id: '$canteenId', totalOrders: { $sum: 1 } } },
        {
          $lookup: {
            from: 'canteens',
            localField: '_id',
            foreignField: '_id',
            as: 'canteen',
          },
        },
        { $unwind: { path: '$canteen', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            canteenId: '$_id',
            canteenName: { $ifNull: ['$canteen.name', 'Unknown Canteen'] },
            totalOrders: 1,
          },
        },
        { $sort: { totalOrders: -1 } },
      ]),
      Order.aggregate([
        { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: {
              canteenId: '$canteenId',
              itemName: '$items.name',
            },
            totalQuantity: { $sum: '$items.quantity' },
          },
        },
        {
          $lookup: {
            from: 'canteens',
            localField: '_id.canteenId',
            foreignField: '_id',
            as: 'canteen',
          },
        },
        { $unwind: { path: '$canteen', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            canteenId: '$_id.canteenId',
            canteenName: { $ifNull: ['$canteen.name', 'Unknown Canteen'] },
            itemName: '$_id.itemName',
            totalQuantity: 1,
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 20 },
      ]),
    ]);

    res.json({
      ordersTodayByCanteen,
      ordersThisWeekByCanteen,
      topSellingItems,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCanteensForAssignment = async (req, res) => {
  try {
    const canteens = await Canteen.find({}).sort({ name: 1 });
    res.json(canteens);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCanteenStaffMembers = async (req, res) => {
  try {
    const { canteenId } = req.query;
    const filter = { role: 'staff' };

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      filter.assignedCanteen = req.user.assignedCanteen;
    } else if (canteenId) {
      if (!isValidObjectId(canteenId)) {
        return res.status(400).json({ message: 'Invalid canteen id' });
      }
      filter.assignedCanteen = canteenId;
    }

    const staffUsers = await User.find(filter)
      .populate('assignedCanteen', 'name location')
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(staffUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCanteenStaffMember = async (req, res) => {
  try {
    const { name, email, password, assignedCanteen } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const targetCanteenId = req.user.role === 'staff' ? req.user.assignedCanteen : assignedCanteen;

    if (!targetCanteenId || !isValidObjectId(targetCanteenId)) {
      return res.status(400).json({ message: 'Valid assignedCanteen is required' });
    }

    const canteen = await Canteen.findById(targetCanteenId);
    if (!canteen) {
      return res.status(404).json({ message: 'Assigned canteen not found' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const created = await User.create({
      name,
      email,
      password,
      role: 'staff',
      assignedCanteen: targetCanteenId,
    });

    res.status(201).json({
      _id: created._id,
      name: created.name,
      email: created.email,
      role: created.role,
      assignedCanteen: created.assignedCanteen,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCanteenStaffMember = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, password, assignedCanteen } = req.body;

    if (!isValidObjectId(staffId)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ message: 'Staff account not found' });
    }

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      if (String(staffUser.assignedCanteen) !== String(req.user.assignedCanteen)) {
        return res.status(403).json({ message: 'You can only manage staff of your assigned canteen' });
      }
    }

    if (assignedCanteen && req.user.role === 'admin') {
      if (!isValidObjectId(assignedCanteen)) {
        return res.status(400).json({ message: 'Invalid assigned canteen id' });
      }
      const canteen = await Canteen.findById(assignedCanteen);
      if (!canteen) {
        return res.status(404).json({ message: 'Assigned canteen not found' });
      }
      staffUser.assignedCanteen = assignedCanteen;
    }

    if (name) staffUser.name = name;
    if (email) staffUser.email = email;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      staffUser.password = password;
    }

    const updated = await staffUser.save();

    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      assignedCanteen: updated.assignedCanteen,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCanteenStaffMember = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!isValidObjectId(staffId)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(404).json({ message: 'Staff account not found' });
    }

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      if (String(staffUser.assignedCanteen) !== String(req.user.assignedCanteen)) {
        return res.status(403).json({ message: 'You can only manage staff of your assigned canteen' });
      }
    }

    await User.deleteOne({ _id: staffUser._id });
    res.json({ message: 'Staff account removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
