import express from 'express';
import {
  createCanteen,
  getCanteens,
  getCanteenById,
  updateCanteen,
  deleteCanteen,
} from '../controllers/canteenController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getCanteens).post(protect, admin, createCanteen);
router
  .route('/:id')
  .get(getCanteenById)
  .put(protect, admin, updateCanteen)
  .delete(protect, admin, deleteCanteen);

export default router;
