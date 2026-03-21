import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Canteen from '../models/Canteen.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

dotenv.config();

const canteenNames = [
  'Basement Canteen',
  'New Building Canteen',
  'Anohana Canteen',
];

const menuItemsByCategory = {
  Rice: [
    {
      name: 'Chicken Fried Rice',
      price: 790,
      description: 'Wok tossed rice with chicken, egg, and vegetables.',
      image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?q=80&w=1200&auto=format&fit=crop',
      isSpecial: true,
      dailyQuantity: 35,
    },
    {
      name: 'Vegetable Nasi Goreng',
      price: 680,
      description: 'Spiced Indonesian style rice with fresh vegetables.',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
      isSpecial: false,
      dailyQuantity: 30,
    },
  ],
  Snacks: [
    {
      name: 'Chicken Roll',
      price: 220,
      description: 'Crispy crumb fried roll with seasoned chicken filling.',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1200&auto=format&fit=crop',
      isSpecial: false,
      dailyQuantity: 60,
    },
    {
      name: 'Masala Vadai',
      price: 140,
      description: 'Crunchy lentil fritter with curry leaves and onion.',
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=1200&auto=format&fit=crop',
      isSpecial: false,
      dailyQuantity: 80,
    },
  ],
  Drinks: [
    {
      name: 'Iced Milo',
      price: 280,
      description: 'Chilled chocolate malt drink served over ice.',
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=1200&auto=format&fit=crop',
      isSpecial: false,
      dailyQuantity: 40,
    },
    {
      name: 'Passion Fruit Juice',
      price: 260,
      description: 'Fresh tropical juice with a sweet and tangy kick.',
      image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?q=80&w=1200&auto=format&fit=crop',
      isSpecial: true,
      dailyQuantity: 45,
    },
  ],
  'Short Eats': [
    {
      name: 'Egg Rotti',
      price: 260,
      description: 'Hot griddled rotti folded with egg and mild spices.',
      image: 'https://images.unsplash.com/photo-1690980442032-57f5f33ccad6?q=80&w=1200&auto=format&fit=crop',
      isSpecial: false,
      dailyQuantity: 40,
    },
    {
      name: 'Cheese Kottu Bite',
      price: 340,
      description: 'Mini kottu bowl with melty cheese and veggies.',
      image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=1200&auto=format&fit=crop',
      isSpecial: false,
      dailyQuantity: 35,
    },
  ],
};

const seedMenuItems = async () => {
  try {
    await connectDB();

    const canteens = await Canteen.find({ name: { $in: canteenNames } });
    const canteenByName = new Map(canteens.map((canteen) => [canteen.name, canteen]));

    const missingCanteens = canteenNames.filter((name) => !canteenByName.has(name));
    if (missingCanteens.length > 0) {
      console.error(
        `Missing canteens: ${missingCanteens.join(', ')}. Run "npm run seed:canteens" first.`
      );
      await mongoose.connection.close();
      process.exit(1);
    }

    let upserts = 0;

    for (const canteenName of canteenNames) {
      const canteen = canteenByName.get(canteenName);

      const categories = await Category.find({ canteen: canteen._id });
      const categoryByName = new Map(categories.map((category) => [category.name, category]));

      const missingCategories = Object.keys(menuItemsByCategory).filter(
        (categoryName) => !categoryByName.has(categoryName)
      );

      if (missingCategories.length > 0) {
        console.error(
          `Missing categories in ${canteenName}: ${missingCategories.join(', ')}. Run "npm run seed:categories" first.`
        );
        await mongoose.connection.close();
        process.exit(1);
      }

      for (const [categoryName, items] of Object.entries(menuItemsByCategory)) {
        const category = categoryByName.get(categoryName);

        for (const item of items) {
          await MenuItem.findOneAndUpdate(
            {
              canteen: canteen._id,
              category: category._id,
              name: item.name,
            },
            {
              ...item,
              available: true,
              canteen: canteen._id,
              category: category._id,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          upserts += 1;
        }
      }
    }

    console.log(`Menu item seed completed (${upserts} upserts across 3 canteens).`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`Menu item seed failed: ${error.message}`);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  }
};

seedMenuItems();
