import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import canteenRoutes from './routes/canteenRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import menuItemRoutes from './routes/menuItemRoutes.js';
import userRoutes from './routes/userRoutes.js';
import connectDB from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // Resolves .env from current working directory (server/)

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/users', userRoutes);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

import { generateToken } from './controllers/authController.js';
app.use('/api/announcements', announcementRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu-items', menuItemRoutes);

app.get('/', (req, res) => {
  res.send('CanteenPro API is running...');
});

// STEP 11 — Create Auth Routes
// (Removed redundant Passport routes in favor of direct token verification)

export default app;
