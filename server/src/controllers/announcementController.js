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

// @desc    Get latest announcement for a canteen
// @route   GET /api/announcements/:canteenId
// @access  Public
export const getCanteenAnnouncements = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ canteenId: req.params.canteenId })
      .populate('canteenId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin or Canteen Staff
export const updateAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (announcement) {
      announcement.message = message || announcement.message;
      const updatedAnnouncement = await announcement.save();
      res.json(updatedAnnouncement);
    } else {
      res.status(404).json({ message: 'Announcement not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin or Canteen Staff
export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (announcement) {
      await announcement.deleteOne();
      res.json({ message: 'Announcement removed' });
    } else {
      res.status(404).json({ message: 'Announcement not found' });
    }
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
