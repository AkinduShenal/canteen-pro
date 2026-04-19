import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import canteenRoutes from './routes/canteenRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import staffAdminRoutes from './routes/staffAdminRoutes.js';
import adminOrdersRoutes from './routes/adminOrdersRoutes.js';
import connectDB from './config/db.js';
import menuItemRoutes from './routes/menuItemRoutes.js';
import menuAssistantRoutes from './routes/menuAssistantRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config(); // Resolves .env from current working directory (server/)

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/canteens', canteenRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/staff-admin', staffAdminRoutes);
app.use('/api/admin', adminOrdersRoutes);
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/menu-assistant', menuAssistantRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (req, res) => {
  res.send('CanteenPro API is running...');
});

// STEP 11 — Create Auth Routes
// (Removed redundant Passport routes in favor of direct token verification)

export default app;
