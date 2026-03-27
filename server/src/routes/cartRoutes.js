import express from 'express';
import { protect, permitRoles } from '../middleware/authMiddleware.js';
import {
  addItemToCart,
  clearMyCart,
  getMyCart,
  removeCartItem,
  updateCartItemQuantity,
} from '../controllers/cartController.js';

const router = express.Router();

router.use(protect);
router.use(permitRoles('student'));

router.get('/mine', getMyCart);
router.post('/items', addItemToCart);
router.patch('/items/:menuItemId', updateCartItemQuantity);
router.delete('/items/:menuItemId', removeCartItem);
router.delete('/mine/clear', clearMyCart);

export default router;
