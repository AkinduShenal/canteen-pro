import express from 'express';
import { permitRoles } from '../../middleware/authMiddleware.js';
import {
  createCanteenStaffMember,
  getCanteenStaffMembers,
  updateCanteenStaffMember,
  deleteCanteenStaffMember,
  getCanteensForAssignment,
} from '../../controllers/staffAdmin/canteenStaffController.js';

const router = express.Router();

router.get('/canteens/options', permitRoles('admin'), getCanteensForAssignment);
router.get('/canteen-staff', permitRoles('staff', 'admin'), getCanteenStaffMembers);
router.post('/canteen-staff', permitRoles('staff', 'admin'), createCanteenStaffMember);
router.put('/canteen-staff/:staffId', permitRoles('staff', 'admin'), updateCanteenStaffMember);
router.delete('/canteen-staff/:staffId', permitRoles('staff', 'admin'), deleteCanteenStaffMember);

export default router;
