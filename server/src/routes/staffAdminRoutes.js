import express from 'express';
import { protect, permitRoles } from '../middleware/authMiddleware.js';
import {
  addFeedbackToCompletedOrder,
  bulkMarkOrdersReady,
  createCanteenStaffMember,
  createStaffAccount,
  deleteCanteenStaffMember,
  deleteStaffAccount,
  getBasicReports,
  getCanteenStaffMembers,
  getCanteensForAssignment,
  getFeedbackList,
  getStaffAccounts,
  getStaffOrders,
  moderateFeedback,
  updateOrderStatus,
  updateCanteenStaffMember,
  updateStaffAccount,
} from '../controllers/staffAdminController.js';

const router = express.Router();

router.use(protect);

router.get('/orders', permitRoles('staff', 'admin'), getStaffOrders);
router.patch('/orders/:orderId/status', permitRoles('staff', 'admin'), updateOrderStatus);
router.patch('/orders/bulk/ready', permitRoles('staff', 'admin'), bulkMarkOrdersReady);

router.post('/orders/:orderId/feedback', permitRoles('student'), addFeedbackToCompletedOrder);
router.get('/feedback', permitRoles('staff', 'admin'), getFeedbackList);
router.delete('/feedback/:orderId', permitRoles('admin'), moderateFeedback);

router.get('/canteens/options', permitRoles('admin'), getCanteensForAssignment);
router.get('/staff', permitRoles('admin'), getStaffAccounts);
router.post('/staff', permitRoles('admin'), createStaffAccount);
router.put('/staff/:staffId', permitRoles('admin'), updateStaffAccount);
router.delete('/staff/:staffId', permitRoles('admin'), deleteStaffAccount);

router.get('/canteen-staff', permitRoles('staff', 'admin'), getCanteenStaffMembers);
router.post('/canteen-staff', permitRoles('staff', 'admin'), createCanteenStaffMember);
router.put('/canteen-staff/:staffId', permitRoles('staff', 'admin'), updateCanteenStaffMember);
router.delete('/canteen-staff/:staffId', permitRoles('staff', 'admin'), deleteCanteenStaffMember);

router.get('/reports/basic', permitRoles('admin'), getBasicReports);

export default router;
