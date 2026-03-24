import Canteen from '../models/Canteen.js';
import Order from '../models/Order.js';

// Helper: Queue
const getQueueStatus = async (canteenId) => {
  const count = await Order.countDocuments({
    canteenId,
    status: { $in: ['pending', 'accepted'] }
  });

  if (count < 5) return 'Low';
  if (count <= 10) return 'Medium';
  return 'High';
};

// Helper: Open/Closed
const getStatus = (openTime, closeTime) => {
  if (!openTime || !closeTime) return 'Closed';
  const now = new Date().getHours();
  const open = parseInt(openTime.split(':')[0]);
  const close = parseInt(closeTime.split(':')[0]);

  return (now >= open && now < close) ? 'Open' : 'Closed';
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

    const updated = await Promise.all(
      canteens.map(async (c) => ({
        ...c._doc,
        status: getStatus(c.openTime, c.closeTime),
        queue: await getQueueStatus(c._id)
      }))
    );

    res.json(updated);
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
        status: getStatus(canteen.openTime, canteen.closeTime),
        queue: await getQueueStatus(canteen._id)
      });
    } else {
      res.status(404).json({ message: 'Canteen not found' });
    }
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
