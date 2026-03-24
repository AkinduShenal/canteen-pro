import Canteen from '../models/Canteen.js';
import User from '../models/User.js';

const buildCanteenLoginLocalPart = (name) => {
  const normalized = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '')
    .slice(0, 30);

  return normalized || 'canteen';
};

const resolveAvailableCanteenEmail = async (canteenName) => {
  const baseLocalPart = buildCanteenLoginLocalPart(canteenName);
  let suffix = 0;

  while (suffix < 200) {
    const localPart = suffix === 0 ? baseLocalPart : `${baseLocalPart}${suffix}`;
    const email = `${localPart}@gmail.com`;
    const exists = await User.exists({ email });

    if (!exists) {
      return email;
    }

    suffix += 1;
  }

  throw new Error('Unable to generate a unique login email for this canteen');
};

// @desc    Create a new canteen
// @route   POST /api/canteens
// @access  Private/Admin
export const createCanteen = async (req, res) => {
  try {
    const {
      name,
      location,
      openTime,
      closeTime,
      contactNumber,
      password,
    } = req.body;

    if (!name || !location || !openTime || !closeTime || !contactNumber) {
      return res.status(400).json({ message: 'Please provide all required canteen fields' });
    }

    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

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
      try {
        const loginEmail = await resolveAvailableCanteenEmail(canteen.name);

        await User.create({
          name: canteen.name,
          email: loginEmail,
          password,
          role: 'staff',
          assignedCanteen: canteen._id,
          isActive: true,
        });

        res.status(201).json({
          ...canteen.toObject(),
          staffLoginEmail: loginEmail,
        });
      } catch (userCreationError) {
        await Canteen.deleteOne({ _id: canteen._id });
        throw userCreationError;
      }
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
