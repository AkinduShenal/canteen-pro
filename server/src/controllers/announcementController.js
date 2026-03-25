import mongoose from 'mongoose';
import Announcement from '../models/Announcement.js';
import Canteen from '../models/Canteen.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// @desc    Create an announcement for a canteen
// @route   POST /api/announcements
// @access  Private/Admin,Staff
export const createAnnouncement = async (req, res) => {
  try {
    const { canteenId, message } = req.body;

    if (!canteenId || !message) {
      return res.status(400).json({ message: 'canteenId and message are required' });
    }

    if (!isValidObjectId(canteenId)) {
      return res.status(400).json({ message: 'Invalid canteenId' });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return res.status(400).json({ message: 'Announcement message cannot be empty' });
    }

    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    const announcement = await Announcement.create({
      canteen: canteenId,
      message: trimmedMessage,
      createdBy: req.user._id,
    });

    return res.status(201).json(announcement);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get announcements for a canteen
// @route   GET /api/announcements/canteen/:canteenId
// @access  Public
export const getAnnouncementsByCanteen = async (req, res) => {
  try {
    const { canteenId } = req.params;

    if (!isValidObjectId(canteenId)) {
      return res.status(400).json({ message: 'Invalid canteenId' });
    }

    const announcements = await Announcement.find({ canteen: canteenId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json(announcements);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};