import express from 'express';
import { permitRoles } from '../../middleware/authMiddleware.js';
import {
  bulkMarkOrdersReady,
  getStaffOrders,
  updateOrderStatus,
} from '../../controllers/staffAdmin/ordersController.js';

const router = express.Router();

router.get('/orders', permitRoles('staff', 'admin'), getStaffOrders);
router.patch('/orders/:orderId/status', permitRoles('staff', 'admin'), updateOrderStatus);
router.patch('/orders/bulk/ready', permitRoles('staff', 'admin'), bulkMarkOrdersReady);

export default router;
