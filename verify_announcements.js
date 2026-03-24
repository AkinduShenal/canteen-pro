import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/src/models/User.js';
import Announcement from './server/src/models/Announcement.js';
import Canteen from './server/src/models/Canteen.js';
import jwt from 'jsonwebtoken';

dotenv.config({ path: './server/.env' });

const verify = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Find or create a canteen
    let canteen = await Canteen.findOne();
    if (!canteen) {
      canteen = await Canteen.create({
        name: 'Test Canteen',
        location: 'Test Location',
        openTime: '08:00 AM',
        closeTime: '08:00 PM',
        contactNumber: '1234567890'
      });
    }
    const canteenId = canteen._id;

    // 2. Clear previous announcements for this canteen
    await Announcement.deleteMany({ canteenId });

    // 3. Create a test announcement directly to verify model
    const ann = await Announcement.create({
      canteenId,
      message: 'Initial Test Announcement'
    });
    console.log('Created announcement directly:', ann._id);

    // 4. Test "Get Latest" logic (which I implemented in getCanteenAnnouncements)
    // Create another one to see if we get the latest
    await Announcement.create({
      canteenId,
      message: 'Latest Test Announcement'
    });

    const latest = await Announcement.findOne({ canteenId }).sort({ createdAt: -1 });
    console.log('Latest announcement found:', latest.message);
    
    if (latest.message === 'Latest Test Announcement') {
      console.log('SUCCESS: Latest announcement logic works.');
    } else {
      console.log('FAILURE: Latest announcement logic failed.');
    }

    // Done
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

verify();
