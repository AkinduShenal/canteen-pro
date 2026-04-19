import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../services/api.js';

const DEFAULT_QUICK_REPLIES = [
  'Show today specials',
  'Suggest under Rs 500',
  'Available drinks',
  'What is out of stock?',
];

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createMessage = (role, text, options = {}) => ({
  id: makeId(),
  role,
  text,
  items: options.items || [],
  quickReplies: options.quickReplies || [],
});

const buildWelcomeMessage = (canteenName) => createMessage(
  'bot',
  `I am your menu assistant for ${canteenName || 'this canteen'}. Ask for specials, budget picks, or available items.`
);

const MenuAssistantWidget = ({ canteenId, canteenName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([buildWelcomeMessage(canteenName)]);
  const messageEndRef = useRef(null);

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

    const userMessage = createMessage('user', text);
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/menu-assistant/chat', {
        canteenId,
        message: text,
      });

      const botMessage = createMessage('bot', data?.reply || 'I could not find a response for that request.', {
        items: data?.items,
        quickReplies: data?.quickReplies,
      });

      setMessages((prev) => [...prev, botMessage]);
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
              placeholder="Ask about specials, budget, or items..."
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
