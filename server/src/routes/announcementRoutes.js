import express from 'express';
import {
  getAnnouncementsByCanteen,
  createAnnouncement,
} from '../controllers/announcementController.js';
import { protect, staff } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, staff, createAnnouncement);
router.route('/canteen/:canteenId').get(getAnnouncementsByCanteen);

export default router;
