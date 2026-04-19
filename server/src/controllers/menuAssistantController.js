import mongoose from 'mongoose';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

const MAX_ITEMS = 6;
const STOP_WORDS = new Set([
  'show',
  'me',
  'the',
  'a',
  'an',
  'and',
  'with',
  'for',
  'item',
  'items',
  'menu',
  'please',
  'want',
  'need',
  'can',
  'could',
  'would',
  'tell',
  'available',
  'only',
  'today',
  'thiyenawada',
  'tiyenawada',
  'mokakda',
  'mokadda',
]);

const QUICK_REPLIES = [
  'Show today specials',
  'Suggest under Rs 500',
  'Available drinks',
  'What is out of stock?',
];

const toText = (value) => String(value || '').trim();
const normalize = (value) => toText(value).toLowerCase();

const formatItems = (items) => items.slice(0, MAX_ITEMS).map((item) => ({
  id: item._id,
  name: item.name,
  price: item.price,
  available: item.available,
  isSpecial: item.isSpecial,
  category: item.category?.name || 'General',
}));

const findBudget = (message) => {
  const match = message.match(/(?:rs\.?|lkr|under|below|within)?\s*(\d{2,5})/i);
  if (!match) return null;

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const getSearchTerms = (message) => normalize(message)
  .split(/[^a-z0-9]+/)
  .filter((part) => part.length >= 3 && !STOP_WORDS.has(part));

const containsAny = (text, terms) => terms.some((term) => text.includes(term));

// @desc    Chat with menu assistant for a selected canteen
// @route   POST /api/menu-assistant/chat
// @access  Public
export const chatWithMenuAssistant = async (req, res) => {
  try {
    const { canteenId, message } = req.body;

    if (!canteenId || !mongoose.Types.ObjectId.isValid(canteenId)) {
      return res.status(400).json({ message: 'Valid canteenId is required' });
    }

    const cleanMessage = toText(message);
    if (!cleanMessage) {
      return res.status(400).json({ message: 'message is required' });
    }

    const [categories, menuItems] = await Promise.all([
      Category.find({ canteen: canteenId }).sort({ name: 1 }),
      MenuItem.find({ canteen: canteenId })
        .populate('category', 'name')
        .sort({ isSpecial: -1, available: -1, name: 1 }),
    ]);

    if (menuItems.length === 0) {
      return res.json({
        reply: 'No menu items are available for this canteen yet.',
        items: [],
        quickReplies: QUICK_REPLIES,
        intent: 'empty-menu',
      });
    }

    const messageLc = normalize(cleanMessage);
    const budget = findBudget(cleanMessage);
    const searchTerms = getSearchTerms(cleanMessage);

    const availableItems = menuItems.filter((item) => item.available);
    const outOfStockItems = menuItems.filter((item) => !item.available);
    const specialItems = availableItems.filter((item) => item.isSpecial);

    const matchedCategory = categories.find((category) => messageLc.includes(normalize(category.name)));

    const wantsSpecials = containsAny(messageLc, ['special', 'today special', 'chef']);
    const wantsOutOfStock = containsAny(messageLc, ['out of stock', 'unavailable', 'food over', 'not available']);
    const wantsAvailability = containsAny(messageLc, ['available', 'in stock', 'thiyenawada', 'tiyenawada']);
    const wantsRecommendation = containsAny(messageLc, ['recommend', 'suggest', 'best', 'popular', 'mokak']);
    const wantsVeg = containsAny(messageLc, ['veg', 'vegetarian']);

    let filtered = availableItems;
    let intent = 'general';
    let reply = 'Here are some menu picks for you.';

    if (wantsSpecials) {
      filtered = specialItems;
      intent = 'specials';
      reply = filtered.length
        ? 'These are today special items you can order now.'
        : 'No active specials right now. Here are the best available items instead.';
      if (!filtered.length) {
        filtered = availableItems;
      }
    }

    if (matchedCategory) {
      filtered = filtered.filter((item) => String(item.category?._id || item.category) === String(matchedCategory._id));
      intent = intent === 'general' ? 'category' : intent;

      const availableCount = availableItems.filter(
        (item) => String(item.category?._id || item.category) === String(matchedCategory._id)
      ).length;

      if (availableCount === 0) {
        return res.json({
          reply: `Foods are over for ${matchedCategory.name} category right now.`,
          items: [],
          quickReplies: QUICK_REPLIES,
          intent: 'food-over-category',
        });
      }

      reply = `Showing available ${matchedCategory.name} items.`;
    }

    if (budget !== null) {
      filtered = filtered.filter((item) => Number(item.price) <= budget);
      intent = 'budget';
      reply = filtered.length
        ? `Here are options under Rs ${budget}.`
        : `No items found under Rs ${budget}.`;
    }

    if (wantsVeg) {
      filtered = filtered.filter((item) => {
        const combined = `${normalize(item.name)} ${normalize(item.description)}`;
        return containsAny(combined, ['veg', 'vegetarian', 'paneer', 'tofu', 'mushroom']);
      });
      intent = 'veg';
      reply = filtered.length
        ? 'Here are vegetarian-friendly options.'
        : 'I could not find clear vegetarian labels in this menu yet.';
    }

    if (searchTerms.length > 0) {
      const searched = filtered.filter((item) => {
        const target = `${normalize(item.name)} ${normalize(item.description)} ${normalize(item.category?.name)}`;
        return searchTerms.every((term) => target.includes(term));
      });

      if (searched.length > 0) {
        filtered = searched;
        intent = intent === 'general' ? 'search' : intent;
        reply = 'I found these matching menu items.';
      }
    }

    if (wantsOutOfStock) {
      filtered = outOfStockItems;
      intent = 'out-of-stock';
      reply = filtered.length
        ? 'These items are currently out of stock.'
        : 'Everything seems available right now.';
    }

    if (wantsAvailability && !wantsOutOfStock && intent === 'general') {
      intent = 'available';
      reply = 'These are currently available items.';
    }

    if (wantsRecommendation && intent === 'general') {
      intent = 'recommendation';
      filtered = specialItems.length ? specialItems : availableItems;
      reply = specialItems.length
        ? 'Top picks based on specials are listed below.'
        : 'Here are recommended available items for quick ordering.';
    }

    const responseItems = formatItems(filtered.length ? filtered : availableItems);

    return res.json({
      reply,
      items: responseItems,
      quickReplies: QUICK_REPLIES,
      intent,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
