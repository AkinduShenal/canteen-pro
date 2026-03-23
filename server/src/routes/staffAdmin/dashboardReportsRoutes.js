import express from 'express';
import { permitRoles } from '../../middleware/authMiddleware.js';
import {
  getBasicReports,
  getDashboardMetrics,
} from '../../controllers/staffAdmin/dashboardReportsController.js';

const router = express.Router();

router.get('/dashboard/metrics', permitRoles('staff', 'admin'), getDashboardMetrics);
router.get('/reports/basic', permitRoles('admin'), getBasicReports);

export default router;
