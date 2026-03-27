import express from 'express';
import { protect, permitRoles } from '../middleware/authMiddleware.js';
import {
  cancelMyOrder,
  createOrder,
  getMyOrderById,
  getMyOrders,
} from '../controllers/orderController.js';

const router = express.Router();

router.use(protect);
router.use(permitRoles('student'));

router.route('/').post(createOrder).get(getMyOrders);
router.get('/:orderId', getMyOrderById);
router.patch('/:orderId/cancel', cancelMyOrder);

export default router;
