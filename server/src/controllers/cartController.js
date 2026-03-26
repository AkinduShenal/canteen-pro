import Cart from '../models/Cart.js';
import MenuItem from '../models/MenuItem.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.menuItem');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], canteen: null });
    }
    
    // Auto-calculate total
    let total = 0;
    cart.items.forEach(item => {
      if (item.menuItem) {
        total += item.menuItem.price * item.quantity;
      }
    });

    res.json({ cart, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;
    const menuItem = await MenuItem.findById(menuItemId);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [], canteen: menuItem.canteen });
    }

    // Fix corrupted cart state where canteen is null but items exist
    if (cart.items.length > 0 && !cart.canteen) {
      cart.canteen = menuItem.canteen;
    }

    // Enforce Canteen-Locked Rule (F2)
    if (cart.items.length > 0 && cart.canteen.toString() !== menuItem.canteen.toString()) {
      return res.status(400).json({ 
        message: 'Cannot mix items from different canteens. Please clear your cart first.',
        requiresClear: true
      });
    }

    // Set canteen if cart was empty
    if (cart.items.length === 0) {
      cart.canteen = menuItem.canteen;
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);
    
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({ menuItem: menuItemId, quantity: Number(quantity) });
    }

    await cart.save();
    
    // Populate to return full cart
    await cart.populate('items.menuItem');
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update item quantity
// @route   PUT /api/cart/update
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { menuItemId, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.menuItem.toString() === menuItemId);
    
    if (itemIndex > -1) {
      if (quantity <= 0) {
        // Remove item if quantity goes to 0 or less
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = Number(quantity);
      }
      
      // If cart becomes empty, remove canteen lock
      if (cart.items.length === 0) {
        cart.canteen = null;
      }
      
      await cart.save();
      await cart.populate('items.menuItem');
      res.json(cart);
    } else {
      res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { menuItemId } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.menuItem.toString() !== menuItemId);
    
    if (cart.items.length === 0) {
      cart.canteen = null;
    }

    await cart.save();
    await cart.populate('items.menuItem');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.canteen = null;
      await cart.save();
    } else {
      cart = await Cart.create({ user: req.user._id, items: [], canteen: null });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
