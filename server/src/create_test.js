import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Announcement from './models/Announcement.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const create = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const canteenId = '69c25f542db96e3520510374'; // Basement canteen
    
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
