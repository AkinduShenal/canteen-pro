import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import './Orders.css';

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll for status updates
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const { data } = await api.put(`/orders/${id}/cancel`);
      setOrder(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: '📝' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
    { key: 'ready', label: 'Ready for Pickup', icon: '🥡' },
    { key: 'completed', label: 'Completed', icon: '✅' }
  ];

  const getStepStatus = (stepKey) => {
    if (!order) return '';
    const statuses = ['pending', 'preparing', 'ready', 'completed'];
    const currentIdx = statuses.indexOf(order.status);
    const stepIdx = statuses.indexOf(stepKey);

    if (order.status === 'cancelled') return '';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return '';
  };

  if (loading) return (
    <div className="app-container">
      <Navbar />
      <div className="orders-container" style={{ textAlign: 'center' }}>
        <div className="menu-loading-note">Tracking your order in real-time...</div>
      </div>
    </div>
  );
  
  if (error || !order) return (
    <div className="app-container">
      <Navbar />
      <div className="orders-container" style={{ textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontSize: '1.2rem' }}>⚠️ {error || 'Order not found'}</p>
        <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/myorders')}>Back to My Orders</button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <Navbar />
      <main className="orders-container">
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }} onClick={() => navigate('/myorders')}>
            <span>&larr;</span> Back to History
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-light)' }}>LIVE TRACKING</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{order.canteenId?.name}</div>
          </div>
        </header>

        <div className="tracking-card">
          <header className="tracking-header">
            <h2 style={{ color: 'white', fontSize: '2rem' }}>Order Tracking</h2>
            <div className="token-badge">{order.orderToken}</div>
            <p style={{ marginTop: '1.5rem', opacity: 0.9 }}>
              {order.status === 'cancelled' 
                ? 'This order has been cancelled.' 
                : `Est. Pickup: ${order.pickupTime}`}
            </p>
          </header>

          <div className="tracking-body">
            {order.status !== 'cancelled' && (
              <div className="tracking-steps">
                {statusSteps.map((step) => (
                  <div key={step.key} className={`step-item ${getStepStatus(step.key)}`}>
                    <div className="step-icon">{step.icon}</div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{step.label}</div>
                  </div>
                ))}
              </div>
            )}

            {order.status === 'cancelled' && (
              <div style={{ textAlign: 'center', padding: '2rem', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', marginBottom: '3rem' }}>
                <span style={{ fontSize: '3rem', display: 'block' }}>🚫</span>
                <h3 style={{ color: '#dc2626', marginTop: '1rem' }}>Order Cancelled</h3>
                <p style={{ color: '#991b1b', marginBottom: 0 }}>This order was cancelled and is no longer active.</p>
              </div>
            )}

            <div className="order-details-grid">
              <div className="detail-block">
                <h4>Order Summary</h4>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {order.items.map((item) => (
                    <div key={item._id} className="item-row">
                      <span style={{ fontWeight: '500' }}>{item.quantity}x {item.name}</span>
                      <span style={{ fontWeight: '700' }}>Rs {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="item-row" style={{ marginTop: '1rem', borderTop: '2px solid var(--border-light)', paddingTop: '1rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>Total</span>
                    <span style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--primary-color)' }}>Rs {order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-block">
                <h4>Info & Notes</h4>
                <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '12px' }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)' }}>PICKUP TIME</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>{order.pickupTime}</div>
                  </div>
                  
                  {order.specialNotes ? (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)' }}>NOTES</div>
                      <div style={{ fontSize: '1rem', fontStyle: 'italic', marginTop: '0.5rem' }}>"{order.specialNotes}"</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-light)' }}>NOTES</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>No special instructions provided.</div>
                    </div>
                  )}
                </div>

                {order.status === 'pending' && (
                  <button className="btn-cancel-large" onClick={handleCancel}>
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
