import express from 'express';
import { addRating, getCanteenRatings } from '../controllers/ratingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addRating);
router.get('/:canteenId', getCanteenRatings);

export default router;
