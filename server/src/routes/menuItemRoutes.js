import express from 'express';
import {
  createMenuItem,
  getMenuItems,
  getTodaySpecials,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  toggleMenuItemSpecial,
} from '../controllers/menuItemController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getMenuItems).post(protect, admin, createMenuItem);
router.get('/specials', getTodaySpecials);
router.patch('/:id/availability', protect, admin, toggleMenuItemAvailability);
router.patch('/:id/special', protect, admin, toggleMenuItemSpecial);
router.route('/:id').get(getMenuItemById).put(protect, admin, updateMenuItem).delete(protect, admin, deleteMenuItem);

export default router;
