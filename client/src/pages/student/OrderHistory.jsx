import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';
import api from '../../services/api';

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

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontWeight: '800', color: 'var(--text-dark)' }}>My Orders</h2>
        
        {error && <div style={{ color: '#ef4444', padding: '1rem', background: '#fee2e2', borderRadius: '8px', marginBottom: '2rem' }}>{error}</div>}
        {loading && <div style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>Loading your orders...</div>}

        {!loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🍽️</div>
            <h3 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>No orders yet</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>You haven't placed any orders. Ready to grab a bite?</p>
            <Link to="/menu" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Browse Menu</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map(order => (
              <div key={order._id} style={{ background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid #f8f9fa' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.4rem' }}>Order <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{order.orderToken}</span></h3>
                  <p style={{ margin: 0, color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ background: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span style={{ background: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </p>
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ 
                      padding: '0.4rem 1rem', 
                      borderRadius: '8px', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      textTransform: 'capitalize', 
                      background: order.status === 'cancelled' ? '#fee2e2' : order.status === 'completed' ? '#d1fae5' : '#ffedd5',
                      color: order.status === 'cancelled' ? '#ef4444' : order.status === 'completed' ? '#10b981' : '#f97316'
                    }}>
                      {order.status}
                    </span>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Pickup: <b>{order.pickupTime}</b></span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.6rem', color: 'var(--text-dark)' }}>Rs {order.totalAmount.toFixed(2)}</h3>
                  <Link to={`/orders/${order._id}`} className="btn btn-outline" style={{ borderWidth: '2px', fontWeight: '600' }}>View Details</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
