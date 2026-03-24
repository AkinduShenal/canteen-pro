import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Canteen from '../models/Canteen.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

dotenv.config();

const CANTEEN_NAMES = ['Basement Canteen', 'New Building Canteen', 'Anohana Canteen'];

const SAMPLE_STUDENTS = [
  { name: 'Sample Student One', email: 'samplestudentone@gmail.com' },
  { name: 'Sample Student Two', email: 'samplestudenttwo@gmail.com' },
  { name: 'Sample Student Three', email: 'samplestudentthree@gmail.com' },
  { name: 'Sample Student Four', email: 'samplestudentfour@gmail.com' },
];

const normalizeCanteenEmail = (name) => `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;
const minutesFromNow = (mins) => new Date(Date.now() + mins * 60 * 1000);

const createStatusHistory = ({ status, studentId, staffId }) => {
  const now = Date.now();
  const staffOrStudent = staffId || studentId;

  if (status === 'cancelled') {
    return [
      {
        status: 'pending',
        changedBy: studentId,
        reason: 'Order placed',
        changedAt: new Date(now - 8 * 60 * 1000),
      },
      {
        status: 'cancelled',
        changedBy: staffOrStudent,
        reason: 'Kitchen unavailable',
        changedAt: new Date(now - 2 * 60 * 1000),
      },
    ];
  }

  const steps = ['pending', 'accepted', 'preparing', 'ready', 'completed'];
  const targetIndex = Math.max(0, steps.indexOf(status));

  return steps.slice(0, targetIndex + 1).map((step, idx) => ({
    status: step,
    changedBy: step === 'pending' ? studentId : staffOrStudent,
    reason: idx === 0 ? 'Order placed' : '',
    changedAt: new Date(now - (targetIndex - idx + 1) * 5 * 60 * 1000),
  }));
};

const ORDER_BLUEPRINTS = [
  {
    token: 'BST-S001',
    canteen: 'Basement Canteen',
    studentEmail: 'samplestudentone@gmail.com',
    status: 'pending',
    pickupOffsetMins: 35,
    notes: 'Less sugar please',
    items: [
      { name: 'Milk Tea', quantity: 1, price: 120 },
      { name: 'Egg Bun', quantity: 2, price: 130 },
    ],
  },
  {
    token: 'BST-P001',
    canteen: 'Basement Canteen',
    studentEmail: 'samplestudenttwo@gmail.com',
    status: 'accepted',
    pickupOffsetMins: 10,
    notes: 'Priority pickup',
    items: [
      { name: 'Chicken Kottu', quantity: 1, price: 650 },
    ],
  },
  {
    token: 'BST-P002',
    canteen: 'Basement Canteen',
    studentEmail: 'samplestudentthree@gmail.com',
    status: 'preparing',
    pickupOffsetMins: 8,
    notes: '',
    items: [
      { name: 'Fried Rice', quantity: 1, price: 700 },
      { name: 'Water Bottle', quantity: 1, price: 80 },
    ],
  },
  {
    token: 'BST-S002',
    canteen: 'Basement Canteen',
    studentEmail: 'samplestudentfour@gmail.com',
    status: 'ready',
    pickupOffsetMins: -6,
    notes: 'Call when ready',
    items: [
      { name: 'Vegetable Rotti', quantity: 2, price: 140 },
    ],
  },
  {
    token: 'BST-S003',
    canteen: 'Basement Canteen',
    studentEmail: 'samplestudentone@gmail.com',
    status: 'completed',
    pickupOffsetMins: -65,
    notes: '',
    items: [
      { name: 'Cheese Sandwich', quantity: 1, price: 260 },
      { name: 'Iced Coffee', quantity: 1, price: 280 },
    ],
  },

  {
    token: 'NEW-S001',
    canteen: 'New Building Canteen',
    studentEmail: 'samplestudenttwo@gmail.com',
    status: 'pending',
    pickupOffsetMins: 50,
    notes: '',
    items: [
      { name: 'Coffee', quantity: 1, price: 180 },
      { name: 'Fish Bun', quantity: 1, price: 140 },
    ],
  },
  {
    token: 'NEW-P001',
    canteen: 'New Building Canteen',
    studentEmail: 'samplestudentone@gmail.com',
    status: 'accepted',
    pickupOffsetMins: 12,
    notes: 'No onion',
    items: [
      { name: 'Nasi Goreng', quantity: 1, price: 780 },
    ],
  },
  {
    token: 'NEW-P002',
    canteen: 'New Building Canteen',
    studentEmail: 'samplestudentthree@gmail.com',
    status: 'preparing',
    pickupOffsetMins: 14,
    notes: 'Priority queue test',
    items: [
      { name: 'Chicken Submarine', quantity: 1, price: 520 },
      { name: 'Lime Juice', quantity: 1, price: 160 },
    ],
  },
  {
    token: 'NEW-S002',
    canteen: 'New Building Canteen',
    studentEmail: 'samplestudentfour@gmail.com',
    status: 'completed',
    pickupOffsetMins: -45,
    notes: '',
    items: [
      { name: 'String Hoppers Set', quantity: 1, price: 420 },
    ],
  },

  {
    token: 'ANO-S001',
    canteen: 'Anohana Canteen',
    studentEmail: 'samplestudentthree@gmail.com',
    status: 'pending',
    pickupOffsetMins: 28,
    notes: 'Extra spicy',
    items: [
      { name: 'Paratha', quantity: 2, price: 110 },
      { name: 'Chicken Curry', quantity: 1, price: 340 },
    ],
  },
  {
    token: 'ANO-P001',
    canteen: 'Anohana Canteen',
    studentEmail: 'samplestudentfour@gmail.com',
    status: 'accepted',
    pickupOffsetMins: 9,
    notes: '',
    items: [
      { name: 'Faluda', quantity: 1, price: 350 },
    ],
  },
  {
    token: 'ANO-P002',
    canteen: 'Anohana Canteen',
    studentEmail: 'samplestudentone@gmail.com',
    status: 'preparing',
    pickupOffsetMins: 7,
    notes: 'Priority queue sample',
    items: [
      { name: 'Cheese Kottu', quantity: 1, price: 760 },
    ],
  },
];

const seedOrders = async () => {
  try {
    await connectDB();

    const canteens = await Canteen.find({ name: { $in: CANTEEN_NAMES } });
    if (canteens.length === 0) {
      throw new Error('No canteens found. Run seed:canteens first.');
    }

    await Order.deleteMany({ token: { $regex: /^(BST|NEW|ANO)-/ } });

    for (const student of SAMPLE_STUDENTS) {
      const existing = await User.findOne({ email: student.email });
      if (!existing) {
        await User.create({
          ...student,
          password: '123456',
          role: 'student',
        });
      } else {
        existing.name = student.name;
        existing.role = 'student';
        existing.password = '123456';
        await existing.save();
      }
    }

    const students = await User.find({ email: { $in: SAMPLE_STUDENTS.map((s) => s.email) } });

    let upsertedCount = 0;

    for (const blueprint of ORDER_BLUEPRINTS) {
      const canteen = canteens.find((c) => c.name === blueprint.canteen);
      if (!canteen) continue;

      const student = students.find((s) => s.email === blueprint.studentEmail);
      if (!student) continue;

      const staffEmail = normalizeCanteenEmail(blueprint.canteen);
      const staffUser = await User.findOne({ email: staffEmail, role: 'staff' });

      const totalAmount = blueprint.items.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0,
      );

      await Order.findOneAndUpdate(
        { token: blueprint.token },
        {
          canteenId: canteen._id,
          userId: student._id,
          items: blueprint.items,
          pickupTime: minutesFromNow(blueprint.pickupOffsetMins),
          notes: blueprint.notes || '',
          token: blueprint.token,
          totalAmount,
          status: blueprint.status,
          statusHistory: createStatusHistory({
            status: blueprint.status,
            studentId: student._id,
            staffId: staffUser?._id || null,
          }),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      upsertedCount += 1;
    }

    console.log(`✅ Orders seed completed. Upserted ${upsertedCount} sample orders (including priority orders).`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Orders seed failed: ${error.message}`);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

seedOrders();
