import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config({ path: './.env' });

const resetPasswords = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const usersToReset = [
      { email: 'student@test.com', password: '123456' },
      { email: 'staff2@test.com', password: '123456' }
    ];

    for (const u of usersToReset) {
      const user = await User.findOne({ email: u.email });
      if (user) {
        user.password = u.password;
        await user.save();
        console.log(`Password reset for ${u.email}`);
      } else {
        console.log(`User ${u.email} not found.`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPasswords();
