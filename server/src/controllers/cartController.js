import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import MenuItem from '../models/MenuItem.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const computeCartTotal = (items) =>
  items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

const normalizeCart = (cart) => {
  const safeCart = cart || {
    userId: null,
    canteenId: null,
    items: [],
    totalAmount: 0,
  };

  return {
    _id: safeCart._id || null,
    userId: safeCart.userId || null,
    canteenId: safeCart.canteenId || null,
    items: safeCart.items || [],
    itemCount: (safeCart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    totalAmount: Number(safeCart.totalAmount || 0),
    updatedAt: safeCart.updatedAt || null,
  };
};

const getOrCreateCart = async (userId) => {
  const existing = await Cart.findOne({ userId });
  if (existing) return existing;

  return Cart.create({ userId, canteenId: null, items: [], totalAmount: 0 });
};

export const getMyCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    return res.json(normalizeCart(cart));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const addItemToCart = async (req, res) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    if (!menuItemId || !isValidObjectId(menuItemId)) {
      return res.status(400).json({ message: 'Valid menuItemId is required' });
    }

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ message: 'quantity must be a positive integer' });
    }

    const menuItem = await MenuItem.findById(menuItemId).populate('category', 'name');
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (!menuItem.available) {
      return res.status(400).json({ message: 'This menu item is currently unavailable' });
    }

    const cart = await getOrCreateCart(req.user._id);

    const currentCanteenId = cart.canteenId ? String(cart.canteenId) : null;
    const nextCanteenId = String(menuItem.canteen);

    if (currentCanteenId && currentCanteenId !== nextCanteenId && cart.items.length > 0) {
      return res.status(409).json({
        message: 'Cart is locked to one canteen. Clear cart before adding from another canteen.',
        cartCanteenId: currentCanteenId,
        nextCanteenId,
      });
    }

    cart.canteenId = menuItem.canteen;

    const index = cart.items.findIndex((item) => String(item.menuItemId) === String(menuItem._id));

    if (index >= 0) {
      cart.items[index].quantity += parsedQty;
      cart.items[index].price = menuItem.price;
      cart.items[index].name = menuItem.name;
      cart.items[index].image = menuItem.image || '';
    } else {
      cart.items.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        image: menuItem.image || '',
        price: menuItem.price,
        quantity: parsedQty,
      });
    }

    cart.totalAmount = computeCartTotal(cart.items);
    const updated = await cart.save();

    return res.status(200).json(normalizeCart(updated));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const { quantity } = req.body;

    if (!menuItemId || !isValidObjectId(menuItemId)) {
      return res.status(400).json({ message: 'Valid menuItemId is required' });
    }

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty < 0) {
      return res.status(400).json({ message: 'quantity must be a non-negative integer' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const index = cart.items.findIndex((item) => String(item.menuItemId) === String(menuItemId));

    if (index < 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (parsedQty === 0) {
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = parsedQty;
    }

    if (cart.items.length === 0) {
      cart.canteenId = null;
    }

    cart.totalAmount = computeCartTotal(cart.items);
    const updated = await cart.save();

    return res.json(normalizeCart(updated));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const removeCartItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    if (!menuItemId || !isValidObjectId(menuItemId)) {
      return res.status(400).json({ message: 'Valid menuItemId is required' });
    }

    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((item) => String(item.menuItemId) !== String(menuItemId));

    if (cart.items.length === 0) {
      cart.canteenId = null;
    }

    cart.totalAmount = computeCartTotal(cart.items);
    const updated = await cart.save();

    return res.json(normalizeCart(updated));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const clearMyCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    cart.canteenId = null;
    cart.totalAmount = 0;

    const updated = await cart.save();
    return res.json(normalizeCart(updated));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
