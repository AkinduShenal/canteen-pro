import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import Canteen from './server/src/models/Canteen.js';
import User from './server/src/models/User.js';

dotenv.config({ path: './server/.env' });

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const API_URL = 'http://localhost:5000/api/canteens';

async function verifyAPI() {
  try {
    console.log('--- Starting Canteen API Verification ---');
    
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Find or create a staff user
    let user = await User.findOne({ role: 'staff' });
    if (!user) {
      console.log('Creating a temporary staff user for testing...');
      user = await User.create({
        name: 'Test Staff',
        email: 'teststaff@example.com',
        password: 'password123',
        role: 'staff'
      });
    }
    console.log(`Using staff user: ${user.email} (ID: ${user._id})`);

    // 2. Generate Token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    const config = { headers: { Authorization: `Bearer ${token}` } };
    console.log('Generated staff JWT token.');

    // 3. Test POST /api/canteens
    console.log('\nTesting POST /api/canteens...');
    const newCanteenData = {
      name: 'API Test Canteen ' + Date.now(),
      location: 'Test Block, Level 1',
      openTime: '06:00',
      closeTime: '23:00',
      contactNumber: '011-9998887'
    };
    const postRes = await axios.post(API_URL, newCanteenData, config);
    const createdCanteenId = postRes.data._id;
    console.log('✅ POST Success! Created Canteen ID:', createdCanteenId);

    // 4. Test GET /api/canteens
    console.log('\nTesting GET /api/canteens...');
    const getRes = await axios.get(API_URL);
    const found = getRes.data.find(c => c._id === createdCanteenId);
    if (found) {
      console.log('✅ GET Success! Canteen found in list.');
    } else {
      throw new Error('GET Failed: Created canteen not found in list.');
    }

    // 5. Test PUT /api/canteens/:id
    console.log(`\nTesting PUT ${API_URL}/${createdCanteenId}...`);
    const updateData = { location: 'Updated Test Block, Level 2' };
    const putRes = await axios.put(`${API_URL}/${createdCanteenId}`, updateData, config);
    if (putRes.data.location === updateData.location) {
      console.log('✅ PUT Success! Location updated.');
    } else {
      throw new Error('PUT Failed: Location not updated.');
    }

    // 6. Test DELETE /api/canteens/:id
    console.log(`\nTesting DELETE ${API_URL}/${createdCanteenId}...`);
    const delRes = await axios.delete(`${API_URL}/${createdCanteenId}`, config);
    console.log('✅ DELETE Success!', delRes.data.message);

    // 7. Cleanup temp user if we created it
    if (user.email === 'teststaff@example.com') {
      await User.deleteOne({ _id: user._id });
      console.log('Cleaned up temporary staff user.');
    }

    console.log('\n--- All Canteen API Tests Passed Successfully! ---');
  } catch (error) {
    console.error('\n❌ Test Failed:', error.response?.data || error.message);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

verifyAPI();
