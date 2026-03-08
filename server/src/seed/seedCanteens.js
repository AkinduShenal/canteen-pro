import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Canteen from '../models/Canteen.js';

dotenv.config();

const canteens = [
  {
    name: 'Basement Canteen',
    location: 'SLIIT Malabe - Basement Level',
    openTime: '07:30',
    closeTime: '18:30',
    contactNumber: '0117544801',
  },
  {
    name: 'New Building Canteen',
    location: 'SLIIT Malabe - New Building',
    openTime: '08:00',
    closeTime: '19:00',
    contactNumber: '0117544802',
  },
  {
    name: 'Anohana Canteen',
    location: 'SLIIT Malabe - Near Anohana Area',
    openTime: '08:00',
    closeTime: '17:30',
    contactNumber: '0117544803',
  },
];

const seedCanteens = async () => {
  try {
    await connectDB();

    for (const canteen of canteens) {
      await Canteen.findOneAndUpdate(
        { name: canteen.name },
        canteen,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('✅ Canteen seed completed (3 SLIIT canteens upserted).');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Canteen seed failed: ${error.message}`);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

seedCanteens();
