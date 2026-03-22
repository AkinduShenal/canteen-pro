import mongoose from 'mongoose';
import Canteen from '../models/Canteen.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const toRegex = (value) => new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

const parseBoolean = (value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
};

// @desc    Create menu item
// @route   POST /api/menu-items
// @access  Private/Admin,Staff
export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      image,
      available,
      isSpecial,
      dailyQuantity,
      canteenId,
      categoryId,
    } = req.body;

    if (!name || price === undefined || !canteenId || !categoryId) {
      return res.status(400).json({ message: 'name, price, canteenId and categoryId are required' });
    }

    if (!isValidObjectId(canteenId) || !isValidObjectId(categoryId)) {
      return res.status(400).json({ message: 'Invalid canteenId or categoryId' });
    }

    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid non-negative number' });
    }

    let parsedDailyQuantity = null;
    if (dailyQuantity !== undefined && dailyQuantity !== null && dailyQuantity !== '') {
      parsedDailyQuantity = Number(dailyQuantity);
      if (!Number.isInteger(parsedDailyQuantity) || parsedDailyQuantity < 0) {
        return res.status(400).json({ message: 'dailyQuantity must be a non-negative integer' });
      }
    }

    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.canteen.toString() !== canteenId) {
      return res.status(400).json({ message: 'Category does not belong to the selected canteen' });
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      return res.status(400).json({ message: 'Item name cannot be empty' });
    }

    const duplicate = await MenuItem.findOne({
      canteen: canteenId,
      category: categoryId,
      name: { $regex: toRegex(normalizedName) },
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Menu item already exists in this category' });
    }

    const parsedAvailable = parseBoolean(available);
    const isAvailable = parsedAvailable === null ? true : parsedAvailable;

    const parsedSpecial = parseBoolean(isSpecial);
    const markSpecial = parsedSpecial === null ? false : parsedSpecial;

    // Specials are only valid for available items.
    const finalIsSpecial = isAvailable ? markSpecial : false;

    const item = await MenuItem.create({
      name: normalizedName,
      price: numericPrice,
      description: description?.trim() || '',
      image: image?.trim() || '',
      available: isAvailable,
      isSpecial: finalIsSpecial,
      dailyQuantity: parsedDailyQuantity,
      canteen: canteenId,
      category: categoryId,
    });

    return res.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Menu item already exists in this category' });
    }
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get menu items with filters
// @route   GET /api/menu-items?canteenId=...&categoryId=...&search=...&availableOnly=true&specialOnly=true
// @access  Public
export const getMenuItems = async (req, res) => {
  try {
    const {
      canteenId,
      categoryId,
      search,
      availableOnly,
      specialOnly,
    } = req.query;

    if (!canteenId || !isValidObjectId(canteenId)) {
      return res.status(400).json({ message: 'Valid canteenId is required' });
    }

    const filter = { canteen: canteenId };

    if (categoryId) {
      if (!isValidObjectId(categoryId)) {
        return res.status(400).json({ message: 'Invalid categoryId' });
      }
      filter.category = categoryId;
    }

    if (search?.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    if (availableOnly === 'true') {
      filter.available = true;
    }

    if (specialOnly === 'true') {
      filter.isSpecial = true;
      filter.available = true;
    }

    const menuItems = await MenuItem.find(filter)
      .populate('category', 'name canteen')
      .sort({ isSpecial: -1, name: 1 });

    let foodOver = false;
    if (categoryId) {
      const availableCount = await MenuItem.countDocuments({
        canteen: canteenId,
        category: categoryId,
        available: true,
      });
      foodOver = availableCount === 0;
    }

    return res.json({
      items: menuItems,
      foodOver,
      message: foodOver ? 'Foods are over for this category' : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get available specials for a canteen
// @route   GET /api/menu-items/specials?canteenId=...
// @access  Public
export const getTodaySpecials = async (req, res) => {
  try {
    const { canteenId } = req.query;

    if (!canteenId || !isValidObjectId(canteenId)) {
      return res.status(400).json({ message: 'Valid canteenId is required' });
    }

    const specials = await MenuItem.find({
      canteen: canteenId,
      isSpecial: true,
      available: true,
    })
      .populate('category', 'name')
      .sort({ updatedAt: -1, name: 1 });

    return res.json(specials);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get menu item by id
// @route   GET /api/menu-items/:id
// @access  Public
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid menu item id' });
    }

    const item = await MenuItem.findById(id).populate('category', 'name').populate('canteen', 'name');

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update menu item
// @route   PUT /api/menu-items/:id
// @access  Private/Admin,Staff
export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid menu item id' });
    }

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const nextName = req.body.name !== undefined ? req.body.name.trim() : item.name;
    if (!nextName) {
      return res.status(400).json({ message: 'Item name cannot be empty' });
    }

    let nextPrice = item.price;
    if (req.body.price !== undefined) {
      const parsed = Number(req.body.price);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: 'Price must be a valid non-negative number' });
      }
      nextPrice = parsed;
    }

    let nextDailyQuantity = item.dailyQuantity;
    if (req.body.dailyQuantity !== undefined) {
      if (req.body.dailyQuantity === null || req.body.dailyQuantity === '') {
        nextDailyQuantity = null;
      } else {
        const parsed = Number(req.body.dailyQuantity);
        if (!Number.isInteger(parsed) || parsed < 0) {
          return res.status(400).json({ message: 'dailyQuantity must be a non-negative integer' });
        }
        nextDailyQuantity = parsed;
      }
    }

    const nextCanteenId = req.body.canteenId || item.canteen.toString();
    const nextCategoryId = req.body.categoryId || item.category.toString();

    if (!isValidObjectId(nextCanteenId) || !isValidObjectId(nextCategoryId)) {
      return res.status(400).json({ message: 'Invalid canteenId or categoryId' });
    }

    const [canteen, category] = await Promise.all([
      Canteen.findById(nextCanteenId),
      Category.findById(nextCategoryId),
    ]);

    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.canteen.toString() !== nextCanteenId) {
      return res.status(400).json({ message: 'Category does not belong to the selected canteen' });
    }

    const duplicate = await MenuItem.findOne({
      _id: { $ne: item._id },
      canteen: nextCanteenId,
      category: nextCategoryId,
      name: { $regex: toRegex(nextName) },
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Menu item already exists in this category' });
    }

    let nextAvailable = item.available;
    if (req.body.available !== undefined) {
      const parsed = parseBoolean(req.body.available);
      if (parsed === null) {
        return res.status(400).json({ message: 'available must be true or false' });
      }
      nextAvailable = parsed;
    }

    let nextSpecial = item.isSpecial;
    if (req.body.isSpecial !== undefined) {
      const parsed = parseBoolean(req.body.isSpecial);
      if (parsed === null) {
        return res.status(400).json({ message: 'isSpecial must be true or false' });
      }
      nextSpecial = parsed;
    }

    if (!nextAvailable) {
      nextSpecial = false;
    }

    item.name = nextName;
    item.price = nextPrice;
    item.description = req.body.description !== undefined ? (req.body.description?.trim() || '') : item.description;
    item.image = req.body.image !== undefined ? (req.body.image?.trim() || '') : item.image;
    item.available = nextAvailable;
    item.isSpecial = nextSpecial;
    item.dailyQuantity = nextDailyQuantity;
    item.canteen = nextCanteenId;
    item.category = nextCategoryId;

    const updated = await item.save();
    return res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Menu item already exists in this category' });
    }
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu-items/:id
// @access  Private/Admin,Staff
export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid menu item id' });
    }

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await MenuItem.deleteOne({ _id: item._id });
    return res.json({ message: 'Menu item removed' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle menu item availability
// @route   PATCH /api/menu-items/:id/availability
// @access  Private/Admin,Staff
export const toggleMenuItemAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid menu item id' });
    }

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const parsed = parseBoolean(req.body.available);
    item.available = parsed === null ? !item.available : parsed;

    // Out-of-stock items cannot stay marked as specials.
    if (!item.available) {
      item.isSpecial = false;
    }

    const updated = await item.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle menu item special flag
// @route   PATCH /api/menu-items/:id/special
// @access  Private/Admin,Staff
export const toggleMenuItemSpecial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid menu item id' });
    }

    const item = await MenuItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (!item.available) {
      return res.status(400).json({ message: 'Out-of-stock items cannot be marked as special' });
    }

    const parsed = parseBoolean(req.body.isSpecial);
    item.isSpecial = parsed === null ? !item.isSpecial : parsed;

    const updated = await item.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
