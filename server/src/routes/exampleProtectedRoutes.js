import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ---------------------------------------------------------
// Example 1: Route accessible by ANY logged-in user
// ---------------------------------------------------------
// No role restriction needed because only 'protect' is used
router.get('/profile', protect, (req, res) => {
  res.status(200).json({ 
    message: 'Welcome to your profile!', 
    user: req.user 
  });
});

// ---------------------------------------------------------
// Example 2: Route accessible ONLY by students
// ---------------------------------------------------------
// Only users with role === 'student' can access
router.get('/student-dashboard', protect, authorizeRoles('student'), (req, res) => {
  res.status(200).json({ 
    message: 'Student Dashboard Access Granted. You are a student.' 
  });
});

// ---------------------------------------------------------
// Example 3: Route accessible ONLY by staff
// ---------------------------------------------------------
// Only users with role === 'staff' can access
router.get('/staff-dashboard', protect, authorizeRoles('staff'), (req, res) => {
  res.status(200).json({ 
    message: 'Staff Dashboard Access Granted. You are a staff member.' 
  });
});

// ---------------------------------------------------------
// Example 4: Route accessible ONLY by admins
// ---------------------------------------------------------
// Only users with role === 'admin' can access
router.get('/admin-dashboard', protect, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({ 
    message: 'Admin Dashboard Access Granted. You are an admin.' 
  });
});

// ---------------------------------------------------------
// Example 5: Route accessible by multiple roles (e.g., admin and staff)
// ---------------------------------------------------------
router.get('/manage-menus', protect, authorizeRoles('admin', 'staff'), (req, res) => {
  res.status(200).json({ 
    message: 'Menu Management Access Granted. You are admin or staff.' 
  });
});

export default router;
