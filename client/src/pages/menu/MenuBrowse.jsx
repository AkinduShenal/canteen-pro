import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';

const ALL_CATEGORIES = 'all';
const CART_STORAGE_KEY = 'canteen_cart';

const MenuBrowse = () => {
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [specials, setSpecials] = useState([]);
  const [foodOver, setFoodOver] = useState(false);
  const [foodOverMessage, setFoodOverMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [queueStatus, setQueueStatus] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === ALL_CATEGORIES) {
      return 'All';
    }
    const category = categories.find((entry) => entry._id === selectedCategory);
    return category?.name || 'Selected';
  }, [categories, selectedCategory]);

  useEffect(() => {
    const loadCanteens = async () => {
      try {
        setLoading(true);
        setError('');

        const { data } = await api.get('/canteens');
        setCanteens(data || []);

        if (data?.length > 0) {
          setSelectedCanteen(data[0]._id);
        }
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Failed to load canteens');
      } finally {
        setLoading(false);
      }
    };

    loadCanteens();
  }, []);

  useEffect(() => {
    if (!selectedCanteen) {
      setCategories([]);
      setSelectedCategory(ALL_CATEGORIES);
      setQueueStatus(null);
      return;
    }

    const loadBaseData = async () => {
      try {
        setError('');

        const [categoryResponse, specialResponse, announcementResponse] = await Promise.all([
          api.get('/categories', { params: { canteenId: selectedCanteen } }),
          api.get('/menu-items/specials', { params: { canteenId: selectedCanteen } }),
          api.get(`/announcements/canteen/${selectedCanteen}`),
        ]);

        setCategories(categoryResponse.data || []);
        setSpecials(specialResponse.data || []);
        setAnnouncements(announcementResponse.data || []);
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Failed to load menu information');
      }
    };

    setSelectedCategory(ALL_CATEGORIES);
    loadBaseData();
  }, [selectedCanteen]);

  useEffect(() => {
    if (!selectedCanteen) {
      setAnnouncements([]);
      return;
    }

    const loadAnnouncements = async () => {
      try {
        setLoadingAnnouncements(true);
        const { data } = await api.get(`/announcements/canteen/${selectedCanteen}`);
        setAnnouncements(data || []);
      } catch {
        setAnnouncements([]);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 30000);
    return () => clearInterval(interval);
  }, [selectedCanteen]);

  useEffect(() => {
    if (!selectedCanteen) {
      return;
    }

    const loadQueueStatus = async () => {
      try {
        setLoadingQueue(true);
        const { data } = await api.get(`/canteens/${selectedCanteen}/queue-status`);
        setQueueStatus(data || null);
      } catch {
        setQueueStatus(null);
      } finally {
        setLoadingQueue(false);
      }
    };

    loadQueueStatus();
    const interval = setInterval(loadQueueStatus, 30000);
    return () => clearInterval(interval);
  }, [selectedCanteen]);

  useEffect(() => {
    if (!selectedCanteen) {
      return;
    }

    const loadMenuItems = async () => {
      try {
        setLoadingItems(true);
        setError('');

        const params = {
          canteenId: selectedCanteen,
        };

        const trimmedSearch = search.trim();
        if (trimmedSearch) {
          params.search = trimmedSearch;
        }

        if (selectedCategory !== ALL_CATEGORIES) {
          params.categoryId = selectedCategory;
        }

        if (availableOnly) {
          params.availableOnly = true;
        }

        const { data } = await api.get('/menu-items', { params });

        setMenuItems(data?.items || []);
        setFoodOver(Boolean(data?.foodOver));
        setFoodOverMessage(data?.message || '');
      } catch (apiError) {
        setError(apiError.response?.data?.message || 'Failed to load menu items');
      } finally {
        setLoadingItems(false);
      }
    };

    loadMenuItems();
  }, [selectedCanteen, selectedCategory, search, availableOnly]);

  useEffect(() => {
    const handleEscapeClose = (event) => {
      if (event.key === 'Escape') {
        setSelectedItem(null);
      }
    };

    if (selectedItem) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscapeClose);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscapeClose);
    };
  }, [selectedItem]);

  const saveItemToCart = (item) => {
    if (!item.available) {
      setActionMessage('This item is currently out of stock.');
      return false;
    }

    const existingCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    const existingIndex = existingCart.findIndex((entry) => entry.itemId === item._id);

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += 1;
    } else {
      existingCart.push({
        itemId: item._id,
        name: item.name,
        price: Number(item.price),
        image: item.image || '',
        category: item.category?.name || 'General',
        canteenId: selectedCanteen,
        quantity: 1,
      });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(existingCart));
    return true;
  };

  const handleAddToCart = (item) => {
    const added = saveItemToCart(item);
    if (added) {
      setActionMessage(`${item.name} added to cart.`);
    }
  };

  const handleOrderNow = (item) => {
    const added = saveItemToCart(item);
    if (added) {
      setSelectedItem(null);
      setActionMessage(`${item.name} added. Proceed to checkout from your cart once cart page is enabled.`);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="menu-page-wrap">
        <section className="menu-page-hero">
          <div className="menu-page-hero-content">
            <p className="menu-kicker">Campus Food Compass</p>
            <h1>Discover today&apos;s canteen flavors</h1>
            <p>
              Filter by category, search your cravings, and catch daily specials before they run out.
            </p>
          </div>
        </section>

        <section className="menu-control-panel">
          <div className="menu-control-row">
            <label className="menu-field">
              <span>Canteen</span>
              <select
                className="menu-select"
                value={selectedCanteen}
                onChange={(event) => setSelectedCanteen(event.target.value)}
              >
                {canteens.map((canteen) => (
                  <option key={canteen._id} value={canteen._id}>
                    {canteen.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="menu-field menu-search-field">
              <span>Search item</span>
              <input
                className="menu-input"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try kottu, rice, juice..."
              />
            </label>

            <label className="menu-toggle-row">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(event) => setAvailableOnly(event.target.checked)}
              />
              Available only
            </label>
          </div>

          <div className="menu-queue-indicator" aria-live="polite">
            <div>
              <p className="menu-queue-title">Real-Time Queue</p>
              {loadingQueue ? (
                <p className="menu-queue-meta">Checking queue status...</p>
              ) : (
                <p className="menu-queue-meta">
                  Estimated prep time: <strong>{queueStatus?.estimatedPrepTime ?? '--'} mins</strong>
                  {' '}• Active orders: <strong>{queueStatus?.activeOrders ?? '--'}</strong>
                </p>
              )}
            </div>
            <span className={`menu-queue-pill ${String(queueStatus?.queueLoad || '').toLowerCase() || 'unknown'}`}>
              {queueStatus?.queueLoad ? `${queueStatus.queueLoad} Queue` : 'Queue Unknown'}
            </span>
          </div>

          <div className="menu-category-chips">
            <button
              type="button"
              className={`menu-chip ${selectedCategory === ALL_CATEGORIES ? 'active' : ''}`}
              onClick={() => setSelectedCategory(ALL_CATEGORIES)}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category._id}
                className={`menu-chip ${selectedCategory === category._id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category._id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {announcements.length > 0 || loadingAnnouncements ? (
          <section className="menu-announcement-bar" aria-live="polite">
            <div className="menu-announcement-icon">📢</div>
            <div>
              <p className="menu-announcement-title">Canteen Announcement</p>
              <p className="menu-announcement-message">
                {loadingAnnouncements
                  ? 'Checking latest updates...'
                  : announcements[0]?.message}
              </p>
            </div>
          </section>
        ) : null}

        {error ? <p className="menu-error">{error}</p> : null}
        {actionMessage ? <p className="menu-action-note">{actionMessage}</p> : null}

        <section className="menu-specials-section">
          <div className="menu-section-head">
            <h2>Today&apos;s Specials</h2>
            <p>Chef picks from {canteens.find((entry) => entry._id === selectedCanteen)?.name || 'selected canteen'}</p>
          </div>
          <div className="menu-special-grid">
            {specials.length === 0 ? (
              <div className="menu-empty-card">No specials available right now.</div>
            ) : (
              specials.map((item) => (
                <article
                  className="menu-special-card menu-card-clickable"
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedItem(item);
                    }
                  }}
                >
                  {item.image ? (
                    <img className="menu-card-image" src={item.image} alt={item.name} loading="lazy" />
                  ) : null}
                  <div className="menu-special-badge">SPECIAL</div>
                  <h3>{item.name}</h3>
                  <p>{item.description || 'Freshly prepared today.'}</p>
                  <div className="menu-item-footer">
                    <strong>LKR {Number(item.price).toFixed(2)}</strong>
                    <span>{item.category?.name || 'General'}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="menu-items-section">
          <div className="menu-section-head">
            <h2>{selectedCategoryName} Menu</h2>
            <p>{loadingItems ? 'Loading items...' : `${menuItems.length} items found`}</p>
          </div>

          {selectedCategory !== ALL_CATEGORIES && foodOver ? (
            <div className="menu-food-over-banner">
              {foodOverMessage || 'Foods are over for this category'}
            </div>
          ) : null}

          <div className="menu-item-grid">
            {!loadingItems && menuItems.length === 0 ? (
              <div className="menu-empty-card">No items found for your current filters.</div>
            ) : (
              menuItems.map((item) => (
                <article
                  className="menu-item-card menu-card-clickable"
                  key={item._id}
                  onClick={() => setSelectedItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedItem(item);
                    }
                  }}
                >
                  {item.image ? (
                    <img className="menu-card-image" src={item.image} alt={item.name} loading="lazy" />
                  ) : null}
                  <div className="menu-item-top">
                    <h3>{item.name}</h3>
                    <span className={`menu-stock-pill ${item.available ? 'in' : 'out'}`}>
                      {item.available ? 'Available' : 'Out of stock'}
                    </span>
                  </div>
                  <p>{item.description || 'No description available.'}</p>
                  <div className="menu-item-footer">
                    <strong>LKR {Number(item.price).toFixed(2)}</strong>
                    <span>{item.category?.name || 'General'}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {loading ? <p className="menu-loading-note">Loading canteens...</p> : null}

        {selectedItem ? (
          <div className="menu-item-modal-backdrop" onClick={() => setSelectedItem(null)}>
            <div
              className="menu-item-modal"
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedItem.name} details`}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="menu-item-modal-close"
                onClick={() => setSelectedItem(null)}
                aria-label="Close item details"
              >
                x
              </button>
              {selectedItem.image ? (
                <img
                  className="menu-item-modal-image"
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  loading="lazy"
                />
              ) : null}
              <div className="menu-item-modal-content">
                <div className="menu-item-modal-head">
                  <h3>{selectedItem.name}</h3>
                  <span className={`menu-stock-pill ${selectedItem.available ? 'in' : 'out'}`}>
                    {selectedItem.available ? 'Available' : 'Out of stock'}
                  </span>
                </div>
                <p>{selectedItem.description || 'No description available.'}</p>
                <div className="menu-item-modal-meta">
                  <strong>LKR {Number(selectedItem.price).toFixed(2)}</strong>
                  <span>{selectedItem.category?.name || 'General'}</span>
                </div>
                <div className="menu-item-modal-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOrderNow(selectedItem)}
                    disabled={!selectedItem.available}
                  >
                    Order Now
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleAddToCart(selectedItem)}
                    disabled={!selectedItem.available}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default MenuBrowse;
