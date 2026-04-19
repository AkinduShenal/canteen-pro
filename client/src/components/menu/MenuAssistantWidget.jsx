import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';

const DEFAULT_QUICK_REPLIES = [
  'Show today specials',
  'අද special මොනවද?',
  'Add 1 special to cart',
  'Place order from cart',
  'Suggest under Rs 500',
  'Drinks තියෙනවද?',
  'What is out of stock?',
];

const WORD_PATTERN = /[a-z0-9\u0d80-\u0dff]+/gi;

const PLACE_ORDER_TERMS = [
  'place order',
  'confirm order',
  'checkout',
  'order place',
  'order eka danna',
  'order ekak danna',
  'order daanna',
  'order දාන්න',
  'order කරන්න',
  'ඕඩර් දාන්න',
  'checkout කරන්න',
];

const OPEN_CART_TERMS = [
  'open cart',
  'view cart',
  'go to cart',
  'cart eka balanna',
  'cart බලන්න',
  'cart එක බලන්න',
];

const ADD_TO_CART_TERMS = [
  'add to cart',
  'add',
  'cart ekata',
  'cart එකට',
  'cart',
  'දාන්න',
  'add කර',
  'order',
];

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const toText = (value) => String(value || '').trim();
const normalize = (value) => toText(value).toLowerCase();

const tokenize = (value) => normalize(value).match(WORD_PATTERN) || [];

const containsAny = (value, terms) => {
  const normalized = normalize(value);
  return terms.some((term) => normalized.includes(normalize(term)));
};

const getRequestedQuantity = (value) => {
  const text = normalize(value);

  const patternMatch = text.match(/(?:qty|quantity|x)\s*(\d{1,2})|(\d{1,2})\s*(?:x|qty|items?|ක්)/i);
  const candidate = patternMatch ? Number(patternMatch[1] || patternMatch[2]) : null;
  if (Number.isInteger(candidate) && candidate > 0 && candidate <= 20) {
    return candidate;
  }

  const standAlone = text.match(/\b(\d{1,2})\b/);
  const next = standAlone ? Number(standAlone[1]) : null;
  if (Number.isInteger(next) && next > 0 && next <= 20) {
    return next;
  }

  return 1;
};

const detectCommand = (value) => {
  const text = normalize(value);

  if (containsAny(text, OPEN_CART_TERMS)) {
    return { type: 'open-cart', quantity: 1 };
  }

  if (containsAny(text, PLACE_ORDER_TERMS)) {
    return { type: 'place-order', quantity: 1 };
  }

  if (containsAny(text, ADD_TO_CART_TERMS)) {
    return { type: 'add-to-cart', quantity: getRequestedQuantity(text) };
  }

  return { type: 'none', quantity: 1 };
};

const pickBestAssistantItem = (items, message) => {
  if (!items.length) {
    return null;
  }

  const messageTokens = tokenize(message);
  let winner = items[0];
  let bestScore = -1;

  items.forEach((item) => {
    const itemTokens = tokenize(`${item.name} ${item.category}`);
    const overlap = itemTokens.filter((token) => messageTokens.includes(token)).length;
    const startsWithBoost = messageTokens.some((token) => normalize(item.name).startsWith(token)) ? 1 : 0;
    const score = overlap * 2 + startsWithBoost;

    if (score > bestScore) {
      bestScore = score;
      winner = item;
    }
  });

  return winner;
};

const createMessage = (role, text, options = {}) => ({
  id: makeId(),
  role,
  text,
  items: options.items || [],
  quickReplies: options.quickReplies || [],
});

const buildWelcomeMessage = (canteenName) => createMessage(
  'bot',
  `I am your menu assistant for ${canteenName || 'this canteen'}. Sinhala හෝ English ඕනම විදිහට අහන්න.`
);

const MenuAssistantWidget = ({ canteenId, canteenName, user }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([buildWelcomeMessage(canteenName)]);
  const messageEndRef = useRef(null);

  const appendBotMessage = (text, options = {}) => {
    setMessages((prev) => [...prev, createMessage('bot', text, options)]);
  };

  const ensureStudent = (actionText) => {
    if (!user) {
      appendBotMessage(`Please sign in as a student to ${actionText}.`);
      return false;
    }

    if (user.role !== 'student') {
      appendBotMessage(`Only student accounts can ${actionText}.`);
      return false;
    }

    return true;
  };

  const addToCartWithConflictHandling = async (menuItemId, quantity) => {
    try {
      await api.post('/cart/items', {
        menuItemId,
        quantity,
      });
      return { ok: true };
    } catch (error) {
      if (error.response?.status !== 409) {
        return {
          ok: false,
          message: error.response?.data?.message || 'Failed to add item to cart.',
        };
      }

      const shouldClear = window.confirm(
        'Your cart has items from another canteen. Clear cart and continue?'
      );

      if (!shouldClear) {
        return {
          ok: false,
          message: 'Kept your existing cart items.',
        };
      }

      await api.delete('/cart/mine/clear');
      await api.post('/cart/items', {
        menuItemId,
        quantity,
      });

      return {
        ok: true,
        message: 'Previous cart cleared and new item added.',
      };
    }
  };

  const tryAddAssistantItemToCart = async (text, assistantData, quantity) => {
    if (!ensureStudent('add items to cart')) {
      return;
    }

    const items = assistantData?.items || [];
    if (!items.length) {
      appendBotMessage('I could not identify an available item to add. Try a more specific item name.');
      return;
    }

    const picked = pickBestAssistantItem(items, text);
    if (!picked?.id) {
      appendBotMessage('I found items, but could not pick one confidently. Please mention the item name again.');
      return;
    }

    const result = await addToCartWithConflictHandling(picked.id, quantity);
    if (!result.ok) {
      appendBotMessage(result.message || 'Could not add item to cart.');
      return;
    }

    appendBotMessage(
      `${picked.name} x${quantity} added to cart. ${result.message || 'Say "place order from cart" when ready.'}`,
      { quickReplies: ['Place order from cart', 'Open cart'] }
    );
  };

  const tryPlaceOrderFromCart = async () => {
    if (!ensureStudent('place orders')) {
      return;
    }

    const { data: cartData } = await api.get('/cart/mine');
    const itemCount = (cartData?.items || []).length;

    if (!itemCount) {
      appendBotMessage('Your cart is empty. Ask me to add an item first.');
      return;
    }

    const pickupDate = new Date(Date.now() + 30 * 60 * 1000);

    try {
      const { data } = await api.post('/orders', {
        pickupTime: pickupDate.toISOString(),
        notes: 'Placed via Menu Assistant',
      });

      appendBotMessage(`Order placed successfully. Token: ${data?.token || 'N/A'}. Redirecting to your orders...`);
      setTimeout(() => navigate('/orders'), 900);
      return;
    } catch (error) {
      const suggestedPickupTime = error.response?.data?.suggestedPickupTime;

      if (!suggestedPickupTime) {
        appendBotMessage(error.response?.data?.message || 'Failed to place order from cart.');
        return;
      }

      const retry = await api.post('/orders', {
        pickupTime: suggestedPickupTime,
        notes: 'Placed via Menu Assistant (suggested slot)',
      });

      appendBotMessage(
        `Selected slot was full, so I used the next available slot. Order token: ${retry.data?.token || 'N/A'}. Redirecting...`
      );
      setTimeout(() => navigate('/orders'), 900);
    }
  };

  useEffect(() => {
    setMessages([buildWelcomeMessage(canteenName)]);
  }, [canteenId, canteenName]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (rawText) => {
    const text = String(rawText || '').trim();
    if (!text || !canteenId || isLoading) {
      return;
    }

    const command = detectCommand(text);

    const userMessage = createMessage('user', text);
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setIsLoading(true);

    try {
      if (command.type === 'open-cart') {
        appendBotMessage('Opening your cart now...');
        navigate('/cart');
        return;
      }

      if (command.type === 'place-order') {
        await tryPlaceOrderFromCart();
        return;
      }

      const { data } = await api.post('/menu-assistant/chat', {
        canteenId,
        message: text,
      });

      const botMessage = createMessage('bot', data?.reply || 'I could not find a response for that request.', {
        items: data?.items,
        quickReplies: data?.quickReplies,
      });

      setMessages((prev) => [...prev, botMessage]);

      if (command.type === 'add-to-cart') {
        await tryAddAssistantItemToCart(text, data, command.quantity);
      }
    } catch (error) {
      const fallback = createMessage(
        'bot',
        error.response?.data?.message || 'Menu assistant is temporarily unavailable. Please try again.'
      );
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickReplies = useMemo(() => {
    const latestBotMessage = [...messages].reverse().find((entry) => entry.role === 'bot');
    return latestBotMessage?.quickReplies?.length ? latestBotMessage.quickReplies : DEFAULT_QUICK_REPLIES;
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(draft);
  };

  return (
    <div className={`menu-assistant ${isOpen ? 'open' : ''}`}>
      {isOpen ? (
        <section className="menu-assistant-panel" aria-label="Menu assistant chatbot">
          <header className="menu-assistant-header">
            <div>
              <p className="menu-assistant-kicker">Smart Menu Helper</p>
              <h3>Menu Assistant</h3>
            </div>
            <button
              type="button"
              className="menu-assistant-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu assistant"
            >
              x
            </button>
          </header>

          <div className="menu-assistant-body">
            {messages.map((entry) => (
              <article
                key={entry.id}
                className={`menu-assistant-message ${entry.role === 'user' ? 'user' : 'bot'}`}
              >
                <p>{entry.text}</p>
                {entry.items?.length > 0 ? (
                  <div className="menu-assistant-item-list">
                    {entry.items.map((item) => (
                      <div className="menu-assistant-item" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{item.category}</span>
                        </div>
                        <div className="menu-assistant-item-meta">
                          <strong>LKR {Number(item.price).toFixed(2)}</strong>
                          <span className={item.available ? 'in' : 'out'}>
                            {item.available ? 'Available' : 'Out'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {isLoading ? <p className="menu-assistant-typing">Assistant is checking the menu...</p> : null}
            <div ref={messageEndRef} />
          </div>

          <div className="menu-assistant-quick-replies">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                className="menu-assistant-chip"
                onClick={() => sendMessage(reply)}
                disabled={isLoading || !canteenId}
              >
                {reply}
              </button>
            ))}
          </div>

          <form className="menu-assistant-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="menu-assistant-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="අද special මොනවද? / Ask about specials, budget, or items..."
              disabled={isLoading || !canteenId}
            />
            <button
              type="submit"
              className="menu-assistant-send"
              disabled={isLoading || !canteenId || !draft.trim()}
            >
              Send
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="menu-assistant-fab"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open menu assistant"
      >
        Menu Assistant
      </button>
    </div>
  );
};

export default MenuAssistantWidget;
