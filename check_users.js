import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/src/models/User.js';

dotenv.config({ path: './server/.env' });

const checkUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');

    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Has Password: ${!!u.password}, GoogleID: ${u.googleId || 'None'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUsers();
