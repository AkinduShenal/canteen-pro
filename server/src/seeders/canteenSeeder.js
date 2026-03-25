import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Canteen from '../models/Canteen.js';

// Load env vars
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeder...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const canteensData = [
  {
    name: 'Basement canteen',
    location: 'Basement Level',
    openTime: '07:00 AM',
    closeTime: '08:00 PM',
    contactNumber: '+1 234 567 8901',
  },
  {
    name: 'New building canteen',
    location: 'New Building',
    openTime: '07:30 AM',
    closeTime: '07:30 PM',
    contactNumber: '+1 234 567 8902',
  },
  {
    name: 'Anohana canteen',
    location: 'Main Campus',
    openTime: '08:00 AM',
    closeTime: '09:00 PM',
    contactNumber: '+1 234 567 8903',
  }
];

const importData = async () => {
  try {
    await connectDB();
    
    // Clear existing
    await Canteen.deleteMany();
    
    // Insert new
    await Canteen.insertMany(canteensData);
    console.log('3 Campus Canteens Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
