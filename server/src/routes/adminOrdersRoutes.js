import express from 'express';
import { protect, permitRoles } from '../middleware/authMiddleware.js';
import {
  getAdminOrders,
  updateAdminOrderStatus,
} from '../controllers/adminOrdersController.js';

const router = express.Router();

router.use(protect);
router.use(permitRoles('admin'));

router.get('/orders', getAdminOrders);
router.patch('/orders/:orderId/status', updateAdminOrderStatus);

export default router;
