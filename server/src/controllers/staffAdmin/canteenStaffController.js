import User from '../../models/User.js';
import Canteen from '../../models/Canteen.js';
import { isValidObjectId } from './shared.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const activeStatusFilter = {
  $or: [{ isActive: true }, { isActive: { $exists: false } }],
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
    const { canteenId, search = '', status = 'all' } = req.query;
    const baseFilter = {
      role: 'staff',
      assignedCanteen: { $exists: true, $ne: null },
    };

    if (req.user.role === 'staff') {
      if (!req.user.assignedCanteen) {
        return res.status(400).json({ message: 'Staff account is not assigned to any canteen' });
      }
      baseFilter.assignedCanteen = req.user.assignedCanteen;
    } else if (canteenId) {
      if (!isValidObjectId(canteenId)) {
        return res.status(400).json({ message: 'Invalid canteen id' });
      }
      baseFilter.assignedCanteen = canteenId;
    } else {
      return res.status(400).json({ message: 'canteenId is required for admin staff listing' });
    }

    const normalizedStatus = String(status || 'all').trim().toLowerCase();
    const filter = { ...baseFilter };

    if (normalizedStatus === 'active') {
      filter.$and = [activeStatusFilter];
    } else if (normalizedStatus === 'inactive') {
      filter.isActive = false;
    }

    const normalizedSearch = String(search || '').trim();
    if (normalizedSearch) {
      const regex = new RegExp(escapeRegex(normalizedSearch), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const staffUsers = await User.find(filter)
      .populate('assignedCanteen', 'name location')
      .select('-password')
      .sort({ createdAt: -1 });

    const [total, active, inactive] = await Promise.all([
      User.countDocuments(baseFilter),
      User.countDocuments({
        ...baseFilter,
        ...activeStatusFilter,
      }),
      User.countDocuments({
        ...baseFilter,
        isActive: false,
      }),
    ]);

    res.json({
      staffMembers: staffUsers,
      summary: {
        total,
        active,
        inactive,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCanteenStaffMember = async (req, res) => {
  try {
    const { name, email, password, assignedCanteen, isActive } = req.body;

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
      isActive: typeof isActive === 'boolean' ? isActive : true,
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
    const { name, email, password, assignedCanteen, isActive } = req.body;

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

    if (typeof isActive === 'boolean') {
      staffUser.isActive = isActive;
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
