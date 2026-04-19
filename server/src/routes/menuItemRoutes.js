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
import { protect, permitRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getMenuItems).post(protect, permitRoles('staff', 'admin'), createMenuItem);
router.get('/specials', getTodaySpecials);
router.patch('/:id/availability', protect, permitRoles('staff', 'admin'), toggleMenuItemAvailability);
router.patch('/:id/special', protect, permitRoles('staff', 'admin'), toggleMenuItemSpecial);
router.route('/:id').get(getMenuItemById).put(protect, permitRoles('staff', 'admin'), updateMenuItem).delete(protect, permitRoles('staff', 'admin'), deleteMenuItem);

export default router;
