import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';

const DEFAULT_CART_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop';

const toDateTimeLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalAmount: 0, canteenId: null });
  const [canteenName, setCanteenName] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [suggestedPickupTime, setSuggestedPickupTime] = useState('');

  const itemCount = useMemo(
    () => (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart.items]
  );

  const averageItemPrice = useMemo(() => {
    if (!itemCount) return 0;
    return Number(cart.totalAmount || 0) / itemCount;
  }, [cart.totalAmount, itemCount]);

  const setQuickPickup = (minutesFromNow) => {
    const next = new Date(Date.now() + minutesFromNow * 60000);
    setPickupTime(toDateTimeLocal(next));
  };

  const resolveImageSrc = (image) => (image && String(image).trim() ? image : DEFAULT_CART_IMAGE);

  const handleImageError = (event) => {
    const img = event.currentTarget;
    if (img.dataset.fallbackApplied === 'true') {
      return;
    }
    img.dataset.fallbackApplied = 'true';
    img.src = DEFAULT_CART_IMAGE;
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/cart/mine');
      setCart(data || { items: [], totalAmount: 0, canteenId: null });

      if (data?.canteenId) {
        const canteenRes = await api.get(`/canteens/${data.canteenId}`);
        setCanteenName(canteenRes.data?.name || 'Selected canteen');
      } else {
        setCanteenName('');
      }
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (menuItemId, nextQuantity) => {
    try {
      setUpdating(true);
      setStatus('');
      await api.patch(`/cart/items/${menuItemId}`, { quantity: nextQuantity });
      await loadCart();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (menuItemId) => {
    try {
      setUpdating(true);
      setStatus('');
      await api.delete(`/cart/items/${menuItemId}`);
      await loadCart();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    try {
      setUpdating(true);
      setStatus('');
      await api.delete('/cart/mine/clear');
      await loadCart();
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'Failed to clear cart');
    } finally {
      setUpdating(false);
    }
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setSuggestedPickupTime('');

    if (!pickupTime) {
      setError('Please select a pickup time');
      return;
    }

    try {
      setPlacingOrder(true);
      const { data } = await api.post('/orders', {
        pickupTime,
        notes: notes.trim(),
      });
      setStatus(`Order placed successfully. Token: ${data.token}`);
      setNotes('');
      setPickupTime('');
      await loadCart();
      setTimeout(() => navigate('/orders'), 1200);
    } catch (apiError) {
      const fallbackError = apiError.response?.data?.message || 'Failed to place order';
      const suggestion = apiError.response?.data?.suggestedPickupTime || '';
      setError(fallbackError);
      setSuggestedPickupTime(suggestion);
    } finally {
      setPlacingOrder(false);
    }
  };

  const applySuggestedPickupTime = () => {
    if (!suggestedPickupTime) {
      return;
    }
    const suggestedDate = new Date(suggestedPickupTime);
    if (Number.isNaN(suggestedDate.getTime())) {
      return;
    }
    setPickupTime(toDateTimeLocal(suggestedDate));
    setStatus('Suggested next available slot applied.');
    setError('');
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="student-order-wrap">
        <section className="student-order-hero">
          <p className="menu-kicker">Student Checkout</p>
          <h1>Your Cart Control Room</h1>
          <p>Keep one canteen per order, tune quantities, and lock your pickup time with confidence.</p>

          <div className="student-order-hero-stats">
            <article>
              <span>Items</span>
              <strong>{itemCount}</strong>
            </article>
            <article>
              <span>Total</span>
              <strong>LKR {Number(cart.totalAmount || 0).toFixed(2)}</strong>
            </article>
            <article>
              <span>Workspace</span>
              <strong>{canteenName || 'No canteen selected'}</strong>
            </article>
          </div>
        </section>

        {error ? <p className="menu-error">{error}</p> : null}
        {status ? <p className="menu-action-note">{status}</p> : null}

        {suggestedPickupTime ? (
          <div className="student-slot-suggestion">
            <p>
              Next available slot: <strong>{new Date(suggestedPickupTime).toLocaleString()}</strong>
            </p>
            <button type="button" className="btn btn-outline" onClick={applySuggestedPickupTime}>
              Use suggested slot
            </button>
          </div>
        ) : null}

        <section className="student-order-grid">
          <article className="student-order-card">
            <div className="student-order-card-head">
              <h2>Your Cart</h2>
              <span>{itemCount} items ready</span>
            </div>

            {loading ? <p className="menu-loading-note">Loading cart...</p> : null}

            {!loading && cart.items.length === 0 ? (
              <div className="student-order-empty-state">
                <h3>Your tray is empty</h3>
                <p>Pick your meal from today&apos;s canteen menu and come back for checkout.</p>
                <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
              </div>
            ) : (
              <div className="student-order-list">
                {cart.items.map((item) => (
                  <article key={item.menuItemId} className="student-order-item-row">
                    <div className="student-order-item-main">
                      <div className="student-order-item-thumb">
                        <img
                          src={resolveImageSrc(item.image)}
                          alt={item.name}
                          loading="lazy"
                          onError={handleImageError}
                        />
                      </div>

                      <div>
                        <h3>{item.name}</h3>
                        <p>LKR {Number(item.price).toFixed(2)} each</p>
                        <strong className="student-order-line-total">
                          Line total: LKR {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    <div className="student-order-item-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={updating || Number(item.quantity) <= 1}
                        onClick={() => updateQuantity(item.menuItemId, Number(item.quantity) - 1)}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={updating}
                        onClick={() => updateQuantity(item.menuItemId, Number(item.quantity) + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        disabled={updating}
                        onClick={() => removeItem(item.menuItemId)}
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="student-order-card-foot">
              <div className="student-order-total-wrap">
                <strong>Total: LKR {Number(cart.totalAmount || 0).toFixed(2)}</strong>
                <small>
                  Avg item: LKR {averageItemPrice ? averageItemPrice.toFixed(2) : '0.00'}
                </small>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                disabled={updating || loading || cart.items.length === 0}
                onClick={clearCart}
              >
                Clear cart
              </button>
            </div>
          </article>

          <article className="student-order-card">
            <div className="student-order-card-head">
              <h2>Checkout</h2>
              <span>Pickup planner</span>
            </div>

            <div className="student-checkout-canteen-lock">
              <span>Canteen lock</span>
              <strong>{canteenName || 'No canteen selected'}</strong>
              <small>One order can include items from only one canteen at a time.</small>
            </div>

            <div className="student-pickup-quick-slots">
              <button type="button" className="btn btn-outline" onClick={() => setQuickPickup(15)}>
                +15 min
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setQuickPickup(30)}>
                +30 min
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setQuickPickup(45)}>
                +45 min
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setQuickPickup(60)}>
                +60 min
              </button>
            </div>

            <form className="student-order-form" onSubmit={placeOrder}>
              <label className="menu-field">
                <span>Pickup Time</span>
                <input
                  className="menu-input"
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(event) => setPickupTime(event.target.value)}
                />
              </label>

              <label className="menu-field">
                <span>Order Notes (optional)</span>
                <textarea
                  className="staff-textarea"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Example: No onions, extra spicy"
                />
              </label>

              <div className="student-checkout-summary">
                <p>
                  <span>Items</span>
                  <strong>{itemCount}</strong>
                </p>
                <p>
                  <span>Total</span>
                  <strong>LKR {Number(cart.totalAmount || 0).toFixed(2)}</strong>
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={placingOrder || loading || cart.items.length === 0}
              >
                {placingOrder ? 'Placing order...' : 'Confirm & Place Order'}
              </button>

              <Link to="/orders" className="btn btn-outline student-order-history-link">
                View Order History
              </Link>
            </form>
          </article>
        </section>
      </main>
    </div>
  );
};

export default CartPage;
