import express from 'express';
import { addOrderItems, getMyOrders, getOrderById, cancelOrder } from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Only students can order

router.route('/')
  .post(addOrderItems);

router.route('/myorders').get(getMyOrders);
router.route('/:id').get(getOrderById);
router.route('/:id/cancel').put(cancelOrder);

export default router;
