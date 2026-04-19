import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategoryAvailabilityStatus,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, permitRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCategories).post(protect, permitRoles('staff', 'admin'), createCategory);
router.get('/:id/availability-status', getCategoryAvailabilityStatus);
router
  .route('/:id')
  .get(getCategoryById)
  .put(protect, permitRoles('staff', 'admin'), updateCategory)
  .delete(protect, permitRoles('staff', 'admin'), deleteCategory);

export default router;
