import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Canteen from '../models/Canteen.js';
import User from '../models/User.js';

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

const normalizeCanteenEmail = (name) => `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`;

const seedUsers = async () => {
  try {
    await connectDB();

    const adminEmail = 'admin@gmail.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
      });
      console.log('Created admin:', adminEmail);
    } else {
      adminExists.name = 'System Admin';
      adminExists.role = 'admin';
      adminExists.assignedCanteen = null;
      adminExists.password = 'admin123';
      await adminExists.save();
      console.log('Updated admin credentials/role:', adminEmail);
    }

    for (const canteenData of canteens) {
      const canteen = await Canteen.findOneAndUpdate(
        { name: canteenData.name },
        canteenData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const email = normalizeCanteenEmail(canteenData.name);
      const existing = await User.findOne({ email });

      if (!existing) {
        await User.create({
          name: `${canteenData.name} Staff`,
          email,
          password: '123456',
          role: 'staff',
          assignedCanteen: canteen._id,
        });
        console.log('Created canteen staff:', email);
      } else {
        existing.name = `${canteenData.name} Staff`;
        existing.role = 'staff';
        existing.assignedCanteen = canteen._id;
        existing.password = '123456';
        await existing.save();
        console.log('Updated canteen staff credentials/assignment:', email);
      }
    }

    await mongoose.connection.close();
    console.log('✅ Staff/Admin seed completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Staff/Admin seed failed:', error.message);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

seedUsers();
