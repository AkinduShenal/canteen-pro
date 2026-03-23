import Order from '../../models/Order.js';
import User from '../../models/User.js';

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
