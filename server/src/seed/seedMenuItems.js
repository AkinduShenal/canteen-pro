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

const menuItemsByCanteen = {
  'Basement Canteen': {
    Rice: [
      {
        name: 'Basement Chicken Kottu',
        price: 850,
        description: 'Street-style chopped rotti with chicken and spicy gravy.',
        image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?q=80&w=1200&auto=format&fit=crop',
        isSpecial: true,
        dailyQuantity: 40,
      },
      {
        name: 'Devilled Rice Bowl',
        price: 760,
        description: 'Hot devilled chicken over fragrant fried rice.',
        image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 30,
      },
    ],
    Snacks: [
      {
        name: 'Basement Fish Bun',
        price: 180,
        description: 'Classic fish bun with curry-spiced filling.',
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 70,
      },
      {
        name: 'Spicy Chicken Roll',
        price: 240,
        description: 'Golden breadcrumb roll packed with chicken masala.',
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 55,
      },
    ],
    Drinks: [
      {
        name: 'Faluda Chill',
        price: 320,
        description: 'Cold rose-milk faluda with basil seeds.',
        image: 'https://images.unsplash.com/photo-1619158401201-8fa932695178?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 35,
      },
      {
        name: 'Wood Apple Smoothie',
        price: 290,
        description: 'Creamy wood apple smoothie with a tropical finish.',
        image: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?q=80&w=1200&auto=format&fit=crop',
        isSpecial: true,
        dailyQuantity: 30,
      },
    ],
    'Short Eats': [
      {
        name: 'Egg Paratha Pocket',
        price: 260,
        description: 'Pan-toasted paratha folded with egg and onion sambol.',
        image: 'https://images.unsplash.com/photo-1683533699837-293fda0f77bf?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 40,
      },
      {
        name: 'Mini Cheese Kottu Cup',
        price: 360,
        description: 'Single serve kottu cup with extra cheese pull.',
        image: 'https://images.unsplash.com/photo-1690980442032-57f5f33ccad6?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 25,
      },
    ],
  },
  'New Building Canteen': {
    Rice: [
      {
        name: 'Thai Basil Chicken Rice',
        price: 920,
        description: 'Aromatic jasmine rice topped with basil chicken.',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1200&auto=format&fit=crop',
        isSpecial: true,
        dailyQuantity: 28,
      },
      {
        name: 'Paneer Fried Rice',
        price: 820,
        description: 'Veg-friendly fried rice with paneer cubes and peppers.',
        image: 'https://images.unsplash.com/photo-1651096061481-7f7a9f01614d?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 24,
      },
    ],
    Snacks: [
      {
        name: 'Peri Peri Fries',
        price: 390,
        description: 'Crispy fries tossed in peri peri seasoning.',
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 45,
      },
      {
        name: 'Loaded Chicken Sub',
        price: 540,
        description: 'Soft sub roll with grilled chicken and garlic mayo.',
        image: 'https://images.unsplash.com/photo-1485451456034-3f9391c6f769?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 32,
      },
    ],
    Drinks: [
      {
        name: 'Iced Caramel Latte',
        price: 420,
        description: 'Cold brew latte finished with caramel drizzle.',
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 30,
      },
      {
        name: 'Blueberry Cooler',
        price: 360,
        description: 'Refreshing berry cooler with soda sparkle.',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=1200&auto=format&fit=crop',
        isSpecial: true,
        dailyQuantity: 34,
      },
    ],
    'Short Eats': [
      {
        name: 'Chicken Wrap Supreme',
        price: 470,
        description: 'Toasted tortilla wrap with chicken and fresh greens.',
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 36,
      },
      {
        name: 'Garlic Mushroom Toast',
        price: 410,
        description: 'Herbed mushroom topping on crunchy garlic toast.',
        image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 25,
      },
    ],
  },
  'Anohana Canteen': {
    Rice: [
      {
        name: 'Veggie Japanese Curry Rice',
        price: 780,
        description: 'Comfort bowl with thick Japanese-style curry gravy.',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=1200&auto=format&fit=crop',
        isSpecial: true,
        dailyQuantity: 30,
      },
      {
        name: 'Teriyaki Chicken Don',
        price: 860,
        description: 'Soy glazed chicken strips on steamed rice.',
        image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 26,
      },
    ],
    Snacks: [
      {
        name: 'Takoyaki Bites',
        price: 450,
        description: 'Crispy octopus-style balls topped with savory sauce.',
        image: 'https://images.unsplash.com/photo-1607301405390-57b7b4ce4f56?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 30,
      },
      {
        name: 'Panko Chicken Pops',
        price: 420,
        description: 'Bite-sized crunchy chicken pops with dip.',
        image: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 34,
      },
    ],
    Drinks: [
      {
        name: 'Matcha Milk',
        price: 390,
        description: 'Creamy iced matcha with light sweetness.',
        image: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?q=80&w=1200&auto=format&fit=crop',
        isSpecial: true,
        dailyQuantity: 28,
      },
      {
        name: 'Yuzu Lemon Soda',
        price: 340,
        description: 'Citrus fizzy drink with yuzu and lemon zest.',
        image: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 33,
      },
    ],
    'Short Eats': [
      {
        name: 'Onigiri Duo',
        price: 300,
        description: 'Two seasoned rice balls with seaweed wrap.',
        image: 'https://images.unsplash.com/photo-1617196035154-1e47f228f2f3?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 38,
      },
      {
        name: 'Katsu Sando Half',
        price: 520,
        description: 'Soft milk bread sandwich with crispy chicken katsu.',
        image: 'https://images.unsplash.com/photo-1559054663-e8d23213f55c?q=80&w=1200&auto=format&fit=crop',
        isSpecial: false,
        dailyQuantity: 22,
      },
    ],
  },
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

      const canteenMenu = menuItemsByCanteen[canteenName];

      const missingCategories = Object.keys(canteenMenu).filter(
        (categoryName) => !categoryByName.has(categoryName)
      );

      if (missingCategories.length > 0) {
        console.error(
          `Missing categories in ${canteenName}: ${missingCategories.join(', ')}. Run "npm run seed:categories" first.`
        );
        await mongoose.connection.close();
        process.exit(1);
      }

      // Reset seeded items for this canteen before inserting its dedicated menu.
      await MenuItem.deleteMany({ canteen: canteen._id });

      for (const [categoryName, items] of Object.entries(canteenMenu)) {
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
