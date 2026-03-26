import express from 'express';
import { permitRoles } from '../../middleware/authMiddleware.js';
import {
  addFeedbackToCompletedOrder,
  getFeedbackList,
  moderateFeedback,
} from '../../controllers/staffAdmin/feedbackController.js';

const router = express.Router();

router.post('/orders/:orderId/feedback', permitRoles('student'), addFeedbackToCompletedOrder);
router.get('/feedback', permitRoles('staff', 'admin'), getFeedbackList);
router.delete('/feedback/:orderId', permitRoles('admin'), moderateFeedback);

export default router;
