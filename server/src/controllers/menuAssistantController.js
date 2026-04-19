import mongoose from 'mongoose';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

const MAX_ITEMS = 6;
const MIN_CATEGORY_SCORE = 2;
const WORD_PATTERN = /[a-z0-9\u0d80-\u0dff]+/gi;

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
  'comment',
  'check',
  'help',
  'please',
  'plz',
  'api',
  'assistant',
  'තියෙනවද',
  'තියෙනවාද',
  'තියෙනව',
  'තියෙනවා',
  'මොනවද',
  'මොකද්ද',
  'මොකක්ද',
  'අද',
  'ද',
]);

const QUICK_REPLIES_BASE = [
  'Show today specials',
  'අද special මොනවද?',
  'Suggest under Rs 500',
  'Drinks තියෙනවද?',
  'Add 1 special to cart',
  'Place order from cart',
  'What is out of stock?',
];

const INTENT_ALIASES = {
  special: [
    'today special',
    'todays special',
    'special',
    'chef pick',
    'chef special',
    'ada special',
    'අද special',
    'අද ස්පෙෂල්',
    'අද විශේෂ',
  ],
  outofstock: [
    'out of stock',
    'unavailable',
    'not available',
    'food over',
    'sold out',
    'stock na',
    'stock naeda',
    'stock nathi',
    'stock නෑ',
    'stock නැ',
    'ඉවරයි',
  ],
  available: [
    'available',
    'in stock',
    'thiyenawada',
    'tiyenawada',
    'thiyenawa',
    'tiyenawa',
    'available da',
    'තියෙනවද',
    'තියෙනවාද',
    'තියෙනව',
    'තියෙනවා',
    'තිබෙනවද',
    'තිබෙනවාද',
  ],
  recommend: [
    'recommend',
    'suggest',
    'best',
    'popular',
    'mokak',
    'mokakda',
    'mokadda',
    'මොනවද',
    'මොකද්ද',
    'හොදම',
    'සජෙස්ට්',
  ],
  veg: ['vegetarian', 'veg', 'meatless', 'නිර්මාංශ'],
};

const QUERY_STOP_WORDS = new Set([
  ...STOP_WORDS,
  'special',
  'outofstock',
  'available',
  'recommend',
  'veg',
  'under',
  'below',
  'within',
  'budget',
  'price',
  'foods',
  'food',
  'stock',
  'අද',
  'රු',
]);

const toText = (value) => String(value || '').trim();
const normalize = (value) => toText(value).toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Removes common comment prefixes so users can type "// show specials" naturally.
const stripCommentDecorators = (value) => {
  const withoutBlockTokens = toText(value).replace(/\/\*|\*\//g, ' ');
  const merged = withoutBlockTokens
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\/\/+|#+|\*+|-+)\s*/, '').trim())
    .filter(Boolean)
    .join(' ');

  return merged.replace(/\s+/g, ' ').trim();
};

const tokenize = (value) => normalize(value).match(WORD_PATTERN) || [];

const normalizeIntentText = (value) => {
  let text = normalize(value)
    .replace(/[^a-z0-9\u0d80-\u0dff]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  Object.entries(INTENT_ALIASES).forEach(([canonical, aliases]) => {
    aliases
      .sort((a, b) => b.length - a.length)
      .forEach((alias) => {
        const aliasText = normalize(alias)
          .replace(/[^a-z0-9\u0d80-\u0dff]+/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!aliasText) {
          return;
        }

        const pattern = new RegExp(`(^|\\s)${escapeRegex(aliasText)}(?=\\s|$)`, 'g');
        text = text.replace(pattern, `$1${canonical}`);
      });
  });

  return text.replace(/\s+/g, ' ').trim();
};

const containsAny = (text, terms) => terms.some((term) => text.includes(term));

const getSearchTerms = (message, excludedTerms = []) => {
  const excluded = new Set(excludedTerms.map((term) => normalize(term)));

  return tokenize(message)
    .filter((part) => part.length >= 3)
    .filter((part) => !QUERY_STOP_WORDS.has(part))
    .filter((part) => !excluded.has(part))
    .filter((part) => !/^\d+$/.test(part));
};

// Scores category against message using direct phrase and token overlap.
const findBestCategoryMatch = (categories, normalizedMessage) => {
  const messageTokens = tokenize(normalizedMessage);
  let bestMatch = null;
  let bestScore = 0;

  categories.forEach((category) => {
    const normalizedCategory = normalize(category.name);
    const categoryTokens = tokenize(normalizedCategory);

    let score = 0;
    if (normalizedMessage.includes(normalizedCategory)) {
      score += 6;
    }

    const overlap = categoryTokens.filter((token) => messageTokens.includes(token)).length;
    score += overlap * 2;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  });

  return bestScore >= MIN_CATEGORY_SCORE ? bestMatch : null;
};

const buildQuickReplies = (categories) => {
  const categoryHint = categories
    .slice(0, 2)
    .map((category) => `${category.name} තියෙනවද?`);

  return [...new Set([...QUICK_REPLIES_BASE, ...categoryHint])].slice(0, 6);
};

const formatItems = (items) => items.slice(0, MAX_ITEMS).map((item) => ({
  id: item._id,
  name: item.name,
  price: item.price,
  available: item.available,
  isSpecial: item.isSpecial,
  category: item.category?.name || 'General',
}));

const findBudget = (message) => {
  const match = message.match(/(?:rs\.?|lkr|under|below|within|රු\.?|රුපියල්)?\s*(\d{2,5})/i);
  if (!match) return null;

  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

// @desc    Chat with menu assistant for a selected canteen
// @route   POST /api/menu-assistant/chat
// @access  Public
export const chatWithMenuAssistant = async (req, res) => {
  try {
    const { canteenId, message } = req.body;

    if (!canteenId || !mongoose.Types.ObjectId.isValid(canteenId)) {
      return res.status(400).json({ message: 'Valid canteenId is required' });
    }

    const cleanMessage = stripCommentDecorators(message);
    if (!cleanMessage) {
      return res.status(400).json({ message: 'message is required' });
    }

    const [categories, menuItems] = await Promise.all([
      Category.find({ canteen: canteenId }).select('name').sort({ name: 1 }).lean(),
      MenuItem.find({ canteen: canteenId })
        .select('name price description available isSpecial category')
        .populate('category', 'name')
        .sort({ isSpecial: -1, available: -1, name: 1 })
        .lean(),
    ]);

    const quickReplies = buildQuickReplies(categories);

    if (menuItems.length === 0) {
      return res.json({
        reply: 'No menu items are available for this canteen yet.',
        items: [],
        quickReplies,
        intent: 'empty-menu',
      });
    }

    const normalizedMessage = normalizeIntentText(cleanMessage);
    const budget = findBudget(cleanMessage);

    const availableItems = menuItems.filter((item) => item.available);
    const outOfStockItems = menuItems.filter((item) => !item.available);
    const specialItems = availableItems.filter((item) => item.isSpecial);

    const matchedCategory = findBestCategoryMatch(categories, normalizedMessage);
    const categoryTerms = matchedCategory ? tokenize(matchedCategory.name) : [];
    const searchTerms = getSearchTerms(normalizedMessage, categoryTerms);

    const wantsSpecials = containsAny(normalizedMessage, ['special']);
    const wantsOutOfStock = containsAny(normalizedMessage, ['outofstock']);
    const wantsAvailability = containsAny(normalizedMessage, ['available']);
    const wantsRecommendation = containsAny(normalizedMessage, ['recommend']);
    const wantsVeg = containsAny(normalizedMessage, ['veg']);

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
          quickReplies,
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
      quickReplies,
      intent,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
