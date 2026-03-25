import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/src/models/User.js';
import bcrypt from 'bcrypt';

dotenv.config({ path: './server/.env' });

const createStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const email = 'staff_test@canteenpro.com';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await User.findOneAndUpdate(
      { email },
      { name: 'Staff Tester', password: hashedPassword, role: 'staff' },
      { upsert: true, new: true }
    );
    
    console.log(`Staff user created/updated: ${email} / ${password}`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createStaff();
