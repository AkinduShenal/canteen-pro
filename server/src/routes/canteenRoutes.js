import express from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  getCanteenQueueStatus,
  updateCanteen,
  deleteCanteen,
  toggleCanteenStatus,
  updateCanteenQueue,
} from '../controllers/canteenController.js';
import { protect, staff, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCanteens).post(protect, admin, createCanteen);
router.route('/:id/queue-status').get(getCanteenQueueStatus);
router.route('/:id/status').put(protect, staff, toggleCanteenStatus);
router.route('/:id/queue').put(protect, staff, updateCanteenQueue);
router
  .route('/:id')
  .get(getCanteenById)
  .put(protect, staff, updateCanteen)
  .delete(protect, staff, deleteCanteen);

router.route('/:id/status').put(protect, staff, toggleCanteenStatus);

export default router;
