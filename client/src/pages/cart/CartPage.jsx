import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';
import api from '../../services/api.js';

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

  const itemCount = useMemo(
    () => (cart.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart.items]
  );

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
      setError(apiError.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <main className="student-order-wrap">
        <section className="student-order-hero">
          <p className="menu-kicker">Student Checkout</p>
          <h1>Cart + Pickup Checkout</h1>
          <p>Keep one canteen per order, adjust quantities, and reserve your pickup slot.</p>
        </section>

        {error ? <p className="menu-error">{error}</p> : null}
        {status ? <p className="menu-action-note">{status}</p> : null}

        <section className="student-order-grid">
          <article className="student-order-card">
            <div className="student-order-card-head">
              <h2>Your Cart</h2>
              <span>{itemCount} items</span>
            </div>

            {loading ? <p className="menu-loading-note">Loading cart...</p> : null}

            {!loading && cart.items.length === 0 ? (
              <div className="menu-empty-card">
                Cart is empty. <Link to="/menu">Go to menu</Link> to add items.
              </div>
            ) : (
              <div className="student-order-list">
                {cart.items.map((item) => (
                  <article key={item.menuItemId} className="student-order-item-row">
                    <div>
                      <h3>{item.name}</h3>
                      <p>LKR {Number(item.price).toFixed(2)} each</p>
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
              <strong>Total: LKR {Number(cart.totalAmount || 0).toFixed(2)}</strong>
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
              <span>{canteenName || 'No canteen selected'}</span>
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

              <button
                type="submit"
                className="btn btn-primary"
                disabled={placingOrder || loading || cart.items.length === 0}
              >
                {placingOrder ? 'Placing order...' : 'Confirm & Place Order'}
              </button>
            </form>
          </article>
        </section>
      </main>
    </div>
  );
};

export default CartPage;
