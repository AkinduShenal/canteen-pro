import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, deleteUserProfile, logoutUser, googleAuth, generateToken } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import passport from 'passport';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);



// Fallback api token check
router.post('/google', googleAuth);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .delete(protect, deleteUserProfile);

export default router;
