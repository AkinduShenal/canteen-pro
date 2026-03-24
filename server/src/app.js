import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import canteenRoutes from './routes/canteenRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import connectDB from './config/db.js';
import passport from './config/passport.js';

dotenv.config(); // Resolves .env from current working directory (server/)

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/announcements', announcementRoutes);

import { generateToken } from './controllers/authController.js';

app.get('/', (req, res) => {
  res.send('CanteenPro API is running...');
});

// STEP 11 — Create Auth Routes
// Redirect to Google
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback after login
app.get("/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = generateToken(req.user._id);
    // redirect to your frontend page
    res.redirect(`http://localhost:3000/canteens?token=${token}`);
  }
);

export default app;
