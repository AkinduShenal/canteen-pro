import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All cart routes require authentication

router.route('/')
  .get(getCart)
  .delete(clearCart);

router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove', removeFromCart);

export default router;
