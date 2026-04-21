import express from 'express';
import { permitRoles } from '../../middleware/authMiddleware.js';
import {
  getBasicReports,
  getDashboardMetrics,
  streamDashboardMetrics,
  streamBasicReports,
} from '../../controllers/staffAdmin/dashboardReportsController.js';

const router = express.Router();

router.get('/dashboard/metrics/stream', permitRoles('staff', 'admin'), streamDashboardMetrics);
router.get('/dashboard/metrics', permitRoles('staff', 'admin'), getDashboardMetrics);
router.get('/reports/basic', permitRoles('admin'), getBasicReports);
router.get('/reports/stream', permitRoles('admin'), streamBasicReports);

export default router;
