import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Canteen from '../models/Canteen.js';
import MenuItem from '../models/MenuItem.js';

// @desc    Create a category under a canteen
// @route   POST /api/categories
// @access  Private/Admin,Staff
export const createCategory = async (req, res) => {
  try {
    const { name, canteenId } = req.body;

    if (!name || !canteenId) {
      return res.status(400).json({ message: 'Name and canteenId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(canteenId)) {
      return res.status(400).json({ message: 'Invalid canteenId' });
    }

    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({ message: 'Canteen not found' });
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      return res.status(400).json({ message: 'Category name cannot be empty' });
    }

    const categoryExists = await Category.findOne({
      canteen: canteenId,
      name: normalizedName,
    });

    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists for this canteen' });
    }

    const category = await Category.create({
      name: normalizedName,
      canteen: canteenId,
    });

    return res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists for this canteen' });
    }
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get categories (optionally by canteen)
// @route   GET /api/categories?canteenId=...
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const { canteenId } = req.query;
    const filter = {};

    if (canteenId) {
      if (!mongoose.Types.ObjectId.isValid(canteenId)) {
        return res.status(400).json({ message: 'Invalid canteenId' });
      }
      filter.canteen = canteenId;
    }

    const categories = await Category.find(filter).sort({ name: 1 });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.json(category);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get availability status for a category
// @route   GET /api/categories/:id/availability-status
// @access  Public
export const getCategoryAvailabilityStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const [totalItems, availableItems] = await Promise.all([
      MenuItem.countDocuments({ category: id }),
      MenuItem.countDocuments({ category: id, available: true }),
    ]);

    const foodOver = totalItems > 0 && availableItems === 0;

    return res.json({
      categoryId: category._id,
      totalItems,
      availableItems,
      foodOver,
      message: foodOver ? 'Foods are over for this category' : null,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin,Staff
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      return res.status(400).json({ message: 'Category name cannot be empty' });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      canteen: category.canteen,
      name: normalizedName,
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Category already exists for this canteen' });
    }

    category.name = normalizedName;

    const updatedCategory = await category.save();
    return res.json(updatedCategory);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists for this canteen' });
    }
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin,Staff
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid category id' });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Category.deleteOne({ _id: category._id });
    return res.json({ message: 'Category removed' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
