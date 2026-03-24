import express from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  updateCanteen,
  deleteCanteen,
} from '../controllers/canteenController.js';
import { protect, staff } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCanteens).post(protect, staff, createCanteen);
router
  .route('/:id')
  .get(getCanteenById)
  .put(protect, staff, updateCanteen)
  .delete(protect, staff, deleteCanteen);

export default router;
