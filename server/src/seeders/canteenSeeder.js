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
    name: 'Main Campus Dining Hall',
    location: 'North Wing, Building A',
    openTime: '07:00 AM',
    closeTime: '09:00 PM',
    contactNumber: '+1 234 567 8901',
  },
  {
    name: 'Tech Park Cafe',
    location: 'Engineering Block',
    openTime: '08:00 AM',
    closeTime: '08:00 PM',
    contactNumber: '+1 234 567 8902',
  },
  {
    name: 'Student Union Food Court',
    location: 'Central Campus',
    openTime: '10:00 AM',
    closeTime: '11:00 PM',
    contactNumber: '+1 234 567 8903',
  },
  {
    name: 'Library Coffee Shop',
    location: 'Library Ground Floor',
    openTime: '07:30 AM',
    closeTime: '10:00 PM',
    contactNumber: '+1 234 567 8904',
  }
];

const importData = async () => {
  try {
    await connectDB();
    
    // Clear existing
    await Canteen.deleteMany();
    
    // Insert new
    await Canteen.insertMany(canteensData);
    console.log('4 Campus Canteens Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
