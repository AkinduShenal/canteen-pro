import express from 'express';
import {
  createAnnouncement,
  getCanteenAnnouncements,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAnnouncements)
  .post(protect, authorizeRoles('staff', 'admin'), createAnnouncement);

router.route('/:canteenId')
  .get(getCanteenAnnouncements);

router.route('/:id')
  .put(protect, authorizeRoles('staff', 'admin'), updateAnnouncement)
  .delete(protect, authorizeRoles('staff', 'admin'), deleteAnnouncement);

export default router;
