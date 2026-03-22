import express from 'express';
import {
  createAnnouncement,
  getCanteenAnnouncements,
  getAnnouncements,
} from '../controllers/announcementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getAnnouncements).post(protect, admin, createAnnouncement);
router.route('/canteen/:canteenId').get(getCanteenAnnouncements);

export default router;
