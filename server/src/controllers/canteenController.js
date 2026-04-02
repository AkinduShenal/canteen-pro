import Canteen from '../models/Canteen.js';
import Order from '../models/Order.js';
import Rating from '../models/Rating.js';
import mongoose from 'mongoose';

// Helper: Queue
const getQueueStatus = async (canteen) => {
  // Manual override: If queueLevel is explicitly set, use it.
  if (canteen.queueLevel) return canteen.queueLevel;

  // Automatic: If queueLevel is null, calculate based on orders.
  const count = await Order.countDocuments({
    canteenId: canteen._id,
    status: { $in: ['pending', 'accepted'] }
  });

  if (count < 5) return 'Low';
  if (count <= 10) return 'Medium';
  return 'High';
};

const getStatus = (openTime, closeTime, isOpen) => {
  // Manual override: If isOpen is explicitly true or false, use it.
  if (isOpen === true) return 'Open';
  if (isOpen === false) return 'Closed';

  // Automatic: If isOpen is null or undefined, calculate based on time.
  if (!openTime || !closeTime) return 'Closed';

  const parseTime = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + (parseInt(minutes, 10) || 0);
  };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  try {
    const openMinutes = parseTime(openTime);
    const closeMinutes = parseTime(closeTime);
    return (currentMinutes >= openMinutes && currentMinutes < closeMinutes) ? 'Open' : 'Closed';
  } catch (e) {
    return 'Closed';
  }
};

// Helper: Rating
const getRatingInfo = async (canteenId, userId = null) => {
  const stats = await Rating.aggregate([
    { $match: { canteenId: new mongoose.Types.ObjectId(canteenId) } },
    {
      $group: {
        _id: '$canteenId',
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 }
      }
    }
  ]);

  let userRating = 0;
  if (userId) {
    const userRatingDoc = await Rating.findOne({ userId, canteenId });
    if (userRatingDoc) userRating = userRatingDoc.rating;
  }

  if (stats.length === 0) {
    return { averageRating: 0, totalRatings: 0, userRating };
  }

  return {
    averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
    totalRatings: stats[0].totalRatings,
    userRating
  };
};

// @desc    Create a new canteen
// @route   POST /api/canteens
// @access  Private/Admin
export const createCanteen = async (req, res) => {
  try {
    const { name, location, openTime, closeTime, contactNumber } = req.body;

    const canteenExists = await Canteen.findOne({ name });
    if (canteenExists) {
      return res.status(400).json({ message: 'Canteen already exists' });
    }

    const canteen = await Canteen.create({
      name,
      location,
      openTime,
      closeTime,
      contactNumber,
      isOpen: req.body.isOpen !== undefined ? req.body.isOpen : null
    });

    if (canteen) {
      res.status(201).json(canteen);
    } else {
      res.status(400).json({ message: 'Invalid canteen data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all canteens
// @route   GET /api/canteens
// @access  Public
export const getCanteens = async (req, res) => {
  try {
    const { search, status, queue } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const canteens = await Canteen.find(query);

    const updated = await Promise.all(
      canteens.map(async (c) => ({
        ...c._doc,
        status: getStatus(c.openTime, c.closeTime, c.isOpen),
        queue: await getQueueStatus(c),
        ...(await getRatingInfo(c._id, req.user ? req.user._id : null))
      }))
    );

    // Filter by dynamic status and queue if provided
    let filtered = updated;
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    if (queue) {
      filtered = filtered.filter(c => c.queue === queue);
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get canteen by ID
// @route   GET /api/canteens/:id
// @access  Public
export const getCanteenById = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);
    if (canteen) {
      res.json({
        ...canteen._doc,
        status: getStatus(canteen.openTime, canteen.closeTime, canteen.isOpen),
        queue: await getQueueStatus(canteen),
        ...(await getRatingInfo(canteen._id, req.user ? req.user._id : null))
      });
    } else {
      res.status(404).json({ message: 'Canteen not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get queue status for a canteen
// @route   GET /api/canteens/:id/queue-status
// @access  Public
export const getCanteenQueueStatus = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);

    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    const activeStatuses = ['pending', 'accepted'];
    const activeOrders = await Order.countDocuments({
      canteenId: canteen._id,
      status: { $in: activeStatuses },
    });

    let queueLoad = 'Low';
    let estimatedPrepTime = 8;

    if (activeOrders >= 8 && activeOrders < 16) {
      queueLoad = 'Medium';
      estimatedPrepTime = 15;
    } else if (activeOrders >= 16) {
      queueLoad = 'High';
      estimatedPrepTime = 25;
    }

    res.json({
      canteenId: canteen._id,
      canteenName: canteen.name,
      activeOrders,
      queueLoad,
      estimatedPrepTime,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a canteen
// @route   PUT /api/canteens/:id
// @access  Private/Admin
export const updateCanteen = async (req, res) => {
  try {
    const { name, location, openTime, closeTime, contactNumber } = req.body;

    const canteen = await Canteen.findById(req.params.id);

    if (canteen) {
      canteen.name = name || canteen.name;
      canteen.location = location || canteen.location;
      canteen.openTime = openTime || canteen.openTime;
      canteen.closeTime = closeTime || canteen.closeTime;
      canteen.contactNumber = contactNumber || canteen.contactNumber;

      if (req.body.isOpen !== undefined) {
        canteen.isOpen = req.body.isOpen;
      }

      const updatedCanteen = await canteen.save();
      res.json(updatedCanteen);
    } else {
      res.status(404).json({ message: 'Canteen not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a canteen
// @route   DELETE /api/canteens/:id
// @access  Private/Admin
export const deleteCanteen = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);

    if (canteen) {
      await Canteen.deleteOne({ _id: canteen._id });
      res.json({ message: 'Canteen removed' });
    } else {
      res.status(404).json({ message: 'Canteen not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle canteen open/closed status
// @route   PUT /api/canteens/:id/status
// @access  Private/Staff
export const toggleCanteenStatus = async (req, res) => {
  try {
    const canteen = await Canteen.findById(req.params.id);

    if (canteen) {
      // If currently null (Automatic), get the current status to decide what to toggle to.
      if (canteen.isOpen === null || canteen.isOpen === undefined) {
        const currentStatus = getStatus(canteen.openTime, canteen.closeTime, canteen.isOpen);
        // If it's currently Open (auto), toggle to Manually Closed (false).
        // If it's currently Closed (auto), toggle to Manually Open (true).
        canteen.isOpen = (currentStatus === 'Open') ? false : true;
      } else {
        // Normal toggle for Boolean values
        canteen.isOpen = !canteen.isOpen;
      }

      const updatedCanteen = await canteen.save();
      
      // Calculate display status for the response
      const response = {
        ...updatedCanteen._doc,
        status: getStatus(updatedCanteen.openTime, updatedCanteen.closeTime, updatedCanteen.isOpen),
        queue: await getQueueStatus(updatedCanteen)
      };
      
      res.json(response);
    } else {
      res.status(404).json({ message: 'Canteen not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update canteen queue level
// @route   PUT /api/canteens/:id/queue
// @access  Private/Staff
export const updateCanteenQueue = async (req, res) => {
  try {
    const { queueLevel } = req.body;
    const canteen = await Canteen.findById(req.params.id);

    if (canteen) {
      // In the frontend, 'Auto' will be passed as null
      canteen.queueLevel = queueLevel === 'Auto' ? null : queueLevel;
      const updatedCanteen = await canteen.save();

      res.json({
        ...updatedCanteen._doc,
        status: getStatus(updatedCanteen.openTime, updatedCanteen.closeTime, updatedCanteen.isOpen),
        queue: await getQueueStatus(updatedCanteen)
      });
    } else {
      res.status(404).json({ message: 'Canteen not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
