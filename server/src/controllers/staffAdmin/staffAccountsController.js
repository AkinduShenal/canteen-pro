import User from '../../models/User.js';
import Canteen from '../../models/Canteen.js';
import { isValidObjectId } from './shared.js';

export const createStaffAccount = async (req, res) => {
  try {
    const { name, email, password, assignedCanteen, isActive } = req.body;

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
      isActive: typeof isActive === 'boolean' ? isActive : true,
    });

    const populatedUser = await User.findById(user._id)
      .populate('assignedCanteen', 'name location')
      .select('-password');

    res.status(201).json({
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      role: populatedUser.role,
      isActive: populatedUser.isActive,
      assignedCanteen: populatedUser.assignedCanteen,
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
    const { name, email, password, assignedCanteen, isActive } = req.body;

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

    if (typeof isActive === 'boolean') {
      staffUser.isActive = isActive;
    }

    const updated = await staffUser.save();

    const populatedUser = await User.findById(updated._id)
      .populate('assignedCanteen', 'name location')
      .select('-password');

    res.json({
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      role: populatedUser.role,
      isActive: populatedUser.isActive,
      assignedCanteen: populatedUser.assignedCanteen,
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
