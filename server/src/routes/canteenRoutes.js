import express from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  updateCanteen,
  deleteCanteen,
} from '../controllers/canteenController.js';
import { protect, permitRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCanteens).post(protect, permitRoles('admin'), createCanteen);
router
  .route('/:id')
  .get(getCanteenById)
  .put(protect, permitRoles('admin'), updateCanteen)
  .delete(protect, permitRoles('admin'), deleteCanteen);

export default router;
