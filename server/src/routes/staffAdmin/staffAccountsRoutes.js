import express from 'express';
import { permitRoles } from '../../middleware/authMiddleware.js';
import {
  createStaffAccount,
  deleteStaffAccount,
  getStaffAccounts,
  updateStaffAccount,
} from '../../controllers/staffAdmin/staffAccountsController.js';

const router = express.Router();

router.get('/staff', permitRoles('admin'), getStaffAccounts);
router.post('/staff', permitRoles('admin'), createStaffAccount);
router.put('/staff/:staffId', permitRoles('admin'), updateStaffAccount);
router.delete('/staff/:staffId', permitRoles('admin'), deleteStaffAccount);

export default router;
