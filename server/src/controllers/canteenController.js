import Canteen from '../models/Canteen.js';
import Order from '../models/Order.js';

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
    const canteens = await Canteen.find({});
    res.json(canteens);
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
      res.json(canteen);
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
