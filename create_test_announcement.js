import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Announcement from './server/src/models/Announcement.js';

dotenv.config({ path: './server/.env' });

const create = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const canteenId = '69c25f542db96e3520510374'; // From browser subagent
    
    // Clear old
    await Announcement.deleteMany({ canteenId });

    // Create new
    await Announcement.create({
      canteenId,
      message: 'Special Discount: 20% off on all meals today! 🍛✨'
    });

    console.log('Test announcement created for canteen:', canteenId);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

create();
