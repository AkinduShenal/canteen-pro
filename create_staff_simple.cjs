const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: './server/.env' });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

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
