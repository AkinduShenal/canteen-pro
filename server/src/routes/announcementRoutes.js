import express from 'express';
import {
  createAnnouncement,
  getAnnouncementsByCanteen,
} from '../controllers/announcementController.js';
import { protect, staff } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, staff, createAnnouncement);
router.get('/canteen/:canteenId', getAnnouncementsByCanteen);

export default router;