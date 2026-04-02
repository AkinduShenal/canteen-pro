import Rating from '../models/Rating.js';
import mongoose from 'mongoose';

// @desc    Add or update rating for a canteen
// @route   POST /api/ratings
// @access  Private
export const addRating = async (req, res) => {
  try {
    const { canteenId, rating } = req.body;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a rating between 1 and 5' });
    }

    // Upsert rating - update if exists, create if not
    const updatedRating = await Rating.findOneAndUpdate(
      { userId, canteenId },
      { rating },
      { new: true, upsert: true }
    );

    res.status(201).json(updatedRating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all ratings for a canteen with user details
// @route   GET /api/ratings/:canteenId
// @access  Public
export const getCanteenRatings = async (req, res) => {
  try {
    const { canteenId } = req.params;

    // Get statistics
    const stats = await Rating.aggregate([
      { $match: { canteenId: new mongoose.Types.ObjectId(canteenId) } },
      {
        $group: {
          _id: '$canteenId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Get individual reviews with user names
    const reviews = await Rating.find({ canteenId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const summary = stats.length > 0 ? {
      averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
      totalRatings: stats[0].totalRatings
    } : { averageRating: 0, totalRatings: 0 };

    res.json({
      ...summary,
      reviews: reviews.map(r => ({
        _id: r._id,
        userName: r.userId ? r.userId.name : 'Unknown User',
        rating: r.rating,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
