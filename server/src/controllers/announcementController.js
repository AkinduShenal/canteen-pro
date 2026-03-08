import Announcement from '../models/Announcement.js';

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Admin or Canteen Staff
export const createAnnouncement = async (req, res) => {
  try {
    const { canteenId, message } = req.body;

    const announcement = await Announcement.create({
      canteenId,
      message,
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get announcements for a canteen
// @route   GET /api/announcements/canteen/:canteenId
// @access  Public or Logged in user
export const getCanteenAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ canteenId: req.params.canteenId })
      .populate('canteenId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate('canteenId', 'name')
      .sort({ createdAt: -1 });
      
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
