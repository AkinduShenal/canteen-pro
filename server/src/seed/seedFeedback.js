import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Canteen from '../models/Canteen.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

dotenv.config();

const TARGET_CANTEENS = ['Basement Canteen', 'New Building Canteen', 'Anohana Canteen'];

const FEEDBACK_SCENARIOS = [
  {
    canteenName: 'Basement Canteen',
    token: 'BST-FB001',
    rating: 5,
    comment: 'Excellent service and tasty food. Queue handling was very fast.',
    isHidden: false,
  },
  {
    canteenName: 'New Building Canteen',
    token: 'NEW-FB001',
    rating: 4,
    comment: 'Good quality. Packaging can be improved a little.',
    isHidden: false,
  },
  {
    canteenName: 'Anohana Canteen',
    token: 'ANO-FB001',
    rating: 2,
    comment: 'Order was delayed and food was cold.',
    isHidden: true,
  },
];

const ensureCompletedStatus = (order, changedBy) => {
  if (order.status === 'completed') return;

  order.status = 'completed';
  order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  order.statusHistory.push({
    status: 'completed',
    changedBy,
    reason: 'Sample feedback seed completion',
    changedAt: new Date(),
  });
};

const getOrCreateOrder = async ({ token, canteenId, studentId }) => {
  const existingByToken = await Order.findOne({ token });
  if (existingByToken) return existingByToken;

  const existingForCanteen = await Order.findOne({ canteenId }).sort({ createdAt: 1 });
  if (existingForCanteen) {
    existingForCanteen.token = token;
    await existingForCanteen.save();
    return existingForCanteen;
  }

  return Order.create({
    token,
    canteenId,
    userId: studentId,
    items: [{ name: 'Sample Meal', quantity: 1, price: 550 }],
    totalAmount: 550,
    pickupTime: new Date(Date.now() - 45 * 60 * 1000),
    notes: 'Seeded order for feedback testing',
    status: 'completed',
    statusHistory: [
      {
        status: 'pending',
        changedBy: studentId,
        reason: 'Order placed',
        changedAt: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        status: 'completed',
        changedBy: studentId,
        reason: 'Seeded order completion',
        changedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  });
};

const seedFeedback = async () => {
  try {
    await connectDB();

    const canteens = await Canteen.find({ name: { $in: TARGET_CANTEENS } });
    if (canteens.length === 0) {
      throw new Error('No canteens found. Run seed:canteens first.');
    }

    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      throw new Error('No admin user found. Run seed:staff-admin-users first.');
    }

    const studentCandidates = await User.find({ role: 'student' }).sort({ createdAt: 1 });
    if (studentCandidates.length === 0) {
      throw new Error('No student users found. Run seed:orders first to generate sample students.');
    }

    let upsertedCount = 0;

    for (let i = 0; i < FEEDBACK_SCENARIOS.length; i += 1) {
      const scenario = FEEDBACK_SCENARIOS[i];
      const canteen = canteens.find((item) => item.name === scenario.canteenName);
      if (!canteen) continue;

      const student = studentCandidates[i % studentCandidates.length];

      const order = await getOrCreateOrder({
        token: scenario.token,
        canteenId: canteen._id,
        studentId: student._id,
      });

      ensureCompletedStatus(order, adminUser._id);

      order.feedback = {
        rating: scenario.rating,
        comment: scenario.comment,
        submittedBy: student._id,
        isHidden: scenario.isHidden,
        moderatedBy: scenario.isHidden ? adminUser._id : null,
        moderatedAt: scenario.isHidden ? new Date() : null,
      };

      await order.save();
      upsertedCount += 1;
    }

    console.log(`✅ Feedback seed completed. Upserted ${upsertedCount} feedback entries.`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Feedback seed failed: ${error.message}`);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

seedFeedback();
