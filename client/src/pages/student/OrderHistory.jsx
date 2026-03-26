import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './Orders.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      case 'pending': return 'status-pending';
      case 'preparing': return 'status-preparing';
      case 'ready': return 'status-ready';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="app-container">
      <Navbar />
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
              <Link 
                key={order._id} 
                to={`/orders/${order._id}`} 
                style={{ textDecoration: 'none', color: 'inherit' }}
                className="order-history-card"
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)', marginBottom: '0.3rem' }}>ORDER TOKEN</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '1px' }}>{order.orderToken}</div>
                </div>
                
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '600' }}>{order.canteenId?.name || 'Canteen'}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div className={`order-status-pill ${getStatusClass(order.status)}`}>
                    {order.status}
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: '500' }}>Pickup: {order.pickupTime}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-light)' }}>TOTAL</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Rs {order.totalAmount.toFixed(2)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderHistory;
