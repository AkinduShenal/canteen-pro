import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import ordersRoutes from './staffAdmin/ordersRoutes.js';
import feedbackRoutes from './staffAdmin/feedbackRoutes.js';
import staffAccountsRoutes from './staffAdmin/staffAccountsRoutes.js';
import canteenStaffRoutes from './staffAdmin/canteenStaffRoutes.js';
import dashboardReportsRoutes from './staffAdmin/dashboardReportsRoutes.js';

const router = express.Router();

router.use(protect);

router.use(ordersRoutes);
router.use(feedbackRoutes);
router.use(staffAccountsRoutes);
router.use(canteenStaffRoutes);
router.use(dashboardReportsRoutes);

export default router;
