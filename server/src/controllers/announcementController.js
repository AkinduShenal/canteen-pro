import Announcement from '../models/Announcement.js';

// @desc    Get announcements for a specific canteen
// @route   GET /api/announcements/canteen/:canteenId
// @access  Public
export const getAnnouncementsByCanteen = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      canteenId: req.params.canteenId,
    }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Staff
export const createAnnouncement = async (req, res) => {
  try {
    const { canteenId, message } = req.body;

    if (!canteenId || !message) {
      return res.status(400).json({ message: 'Please provide canteenId and message' });
    }

    const announcement = await Announcement.create({
      canteenId,
      message,
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
