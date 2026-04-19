import express from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  getCanteenQueueStatus,
  updateCanteen,
  deleteCanteen,
  toggleCanteenStatus,
} from '../controllers/canteenController.js';
import { protect, permitRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getCanteens)
  .post(protect, permitRoles('admin', 'staff'), createCanteen);

router.route('/:id/queue-status').get(getCanteenQueueStatus);

router
  .route('/:id')
  .get(getCanteenById)
  .put(protect, permitRoles('admin', 'staff'), updateCanteen)
  .delete(protect, permitRoles('admin', 'staff'), deleteCanteen);

router
  .route('/:id/status')
  .put(protect, permitRoles('admin', 'staff'), toggleCanteenStatus);

export default router;