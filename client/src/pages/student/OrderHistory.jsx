import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Orders.css';

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Re-order state
  const [reordering, setReordering] = useState(null);       // orderId currently loading
  const [conflictOrder, setConflictOrder] = useState(null); // order waiting for conflict resolution

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/myorders');
        setOrders(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':   return 'status-pending';
      case 'accepted':  return 'status-preparing';
      case 'preparing': return 'status-preparing';
      case 'ready':     return 'status-ready';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  // Core function: add all items from a past order into the cart
  const addItemsToCart = async (order) => {
    for (const item of order.items) {
      await api.post('/cart/add', { menuItemId: item.menuItem, quantity: item.quantity });
    }
  };

  const handleReorder = async (order, clearFirst = false) => {
    setReordering(order._id);
    setConflictOrder(null);
    try {
      if (clearFirst) {
        await api.delete('/cart');
      }
      await addItemsToCart(order);
      navigate('/checkout');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.requiresClear) {
        // Cart has items from a different canteen — ask user
        setConflictOrder(order);
      } else {
        alert(errData?.message || 'Failed to re-order. Please try again.');
      }
    } finally {
      setReordering(null);
    }
  };

  return (
    <div className="app-container">
      <Navbar />

      {/* Canteen Conflict Modal */}
      {conflictOrder && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="modal-icon">🛒</span>
            <h3>Clear Cart?</h3>
            <p>
              Your cart already has items from a different canteen. To re-order from{' '}
              <strong>{conflictOrder.canteenId?.name}</strong>, your current cart will be cleared.
            </p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConflictOrder(null)}>Keep Cart</button>
              <button className="btn-confirm" onClick={() => handleReorder(conflictOrder, true)}>
                Clear &amp; Re-Order
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="orders-container">
        <header className="orders-header">
          <p className="home-kicker">Order Hub</p>
          <h1 style={{ fontSize: '3.5rem', marginTop: '1rem' }}>My Order History</h1>
          <p>Review all your past and current cravings in one place.</p>
        </header>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1.2rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #f87171', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="menu-loading-note">Gathering your order history...</div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '28px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🍽️</div>
            <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>No orders found</h3>
            <p style={{ maxWidth: '500px', margin: '0 auto 2.5rem' }}>You haven't placed any orders yet. Why not explore our delicious canteen menu?</p>
            <Link to="/menu" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>Start Browsing</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div
                key={order._id}
                className="order-history-card"
                style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', alignItems: 'center', gap: '2rem' }}
              >
                {/* Token */}
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)', marginBottom: '0.3rem' }}>ORDER TOKEN</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '1px' }}>{order.orderToken}</div>
                </div>

                {/* Canteen + date — clicking navigates to tracking */}
                <Link to={`/orders/${order._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>{order.canteenId?.name || 'Canteen'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </Link>

                {/* Status */}
                <div style={{ textAlign: 'center' }}>
                  <div className={`order-status-pill ${getStatusClass(order.status)}`}>{order.status}</div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '500' }}>Pickup: {order.pickupTime}</div>
                </div>

                {/* Total */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)' }}>TOTAL</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Rs {order.totalAmount.toFixed(2)}</div>
                </div>

                {/* Re-Order button */}
                <button
                  onClick={() => handleReorder(order)}
                  disabled={reordering === order._id}
                  style={{
                    background: reordering === order._id ? '#e2e8f0' : 'var(--primary-color)',
                    color: reordering === order._id ? 'var(--text-light)' : 'white',
                    border: 'none',
                    borderRadius: '50px',
                    padding: '0.6rem 1.3rem',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: reordering === order._id ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: reordering === order._id ? 'none' : '0 4px 12px var(--primary-glow)',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={e => { if (reordering !== order._id) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {reordering === order._id ? '⏳ Adding...' : '🔁 Re-Order'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
