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

const getStatus = (openTime, closeTime, isOpen) => {
  // Manual override: If isOpen is explicitly false, it's Closed.
  // If it's true, it overrides the time-based logic to be Open.
  // This supports the requirement for manual control override.
  if (isOpen === false) return 'Closed';
  if (isOpen === true) return 'Open';

  // Fallback to automatic time-based logic (if isOpen was somehow undefined)
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
  // Use current IST time as per system prompt metadata if needed, 
  // but standard Date() is usually fine for local execution.
  // The system metadata says it's 2026-03-25T03:04:08+05:30.
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  try {
    const openMinutes = parseTime(openTime);
    const closeMinutes = parseTime(closeTime);
    return (currentMinutes >= openMinutes && currentMinutes < closeMinutes) ? 'Open' : 'Closed';
  } catch (e) {
    return 'Closed';
  }
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
      isOpen: req.body.isOpen !== undefined ? req.body.isOpen : true
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
        status: getStatus(c.openTime, c.closeTime, c.isOpen),
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
        status: getStatus(canteen.openTime, canteen.closeTime, canteen.isOpen),
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
      canteen.isOpen = !canteen.isOpen;
      const updatedCanteen = await canteen.save();
      
      // Calculate display status for the response
      const response = {
        ...updatedCanteen._doc,
        status: getStatus(updatedCanteen.openTime, updatedCanteen.closeTime, updatedCanteen.isOpen),
        queue: await getQueueStatus(updatedCanteen._id)
      };
      
      res.json(response);
    } else {
      res.status(404).json({ message: 'Canteen not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
