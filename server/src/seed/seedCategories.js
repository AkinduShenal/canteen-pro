import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Canteen from '../models/Canteen.js';
import Category from '../models/Category.js';

dotenv.config();

const canteenNames = [
  'Basement Canteen',
  'New Building Canteen',
  'Anohana Canteen',
];

const defaultCategories = ['Rice', 'Snacks', 'Drinks', 'Short Eats'];

const seedCategories = async () => {
  try {
    await connectDB();

    const canteens = await Canteen.find({ name: { $in: canteenNames } });
    const foundByName = new Map(canteens.map((canteen) => [canteen.name, canteen]));

    const missingCanteens = canteenNames.filter((name) => !foundByName.has(name));
    if (missingCanteens.length > 0) {
      console.error(
        `Missing canteens: ${missingCanteens.join(', ')}. Run \"npm run seed:canteens\" first.`
      );
      await mongoose.connection.close();
      process.exit(1);
    }

    let upsertCount = 0;

    for (const canteenName of canteenNames) {
      const canteen = foundByName.get(canteenName);

      for (const categoryName of defaultCategories) {
        await Category.findOneAndUpdate(
          { canteen: canteen._id, name: categoryName },
          { canteen: canteen._id, name: categoryName },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        upsertCount += 1;
      }
    }

    console.log(
      `Category seed completed (${defaultCategories.length} categories x ${canteenNames.length} canteens, ${upsertCount} upserts).`
    );

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Category seed failed: ${error.message}`);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

seedCategories();
