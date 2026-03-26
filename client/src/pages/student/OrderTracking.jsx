import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../services/api';

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

  if (loading) return <div className="app-container"><Navbar /><div className="main-content" style={{padding:'2rem'}}>Loading...</div></div>;
  
  if (error || !order) return <div className="app-container"><Navbar /><div className="main-content" style={{padding:'2rem', color:'var(--danger)'}}>{error}</div></div>;

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <button className="btn btn-outline" style={{ marginBottom: '1.5rem', borderWidth: '2px' }} onClick={() => navigate('/myorders')}>
          &larr; Back to My Orders
        </button>
        
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>Order Tracking</h2>
            <span style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(251,146,60,0.3)' }}>
              {order.orderToken}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem', textAlign: 'center' }}>
            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontWeight: '600' }}>Status</p>
              <h3 style={{ margin: 0, textTransform: 'capitalize', color: order.status === 'cancelled' ? '#ef4444' : order.status === 'completed' ? '#10b981' : 'var(--primary)', fontSize: '1.5rem' }}>{order.status}</h3>
            </div>
            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontWeight: '600' }}>Pickup Time</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-dark)' }}>{order.pickupTime}</h3>
            </div>
            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px' }}>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontWeight: '600' }}>Total</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-dark)' }}>Rs {order.totalAmount.toFixed(2)}</h3>
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', color: 'var(--text-dark)' }}>Order Items</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map(item => (
                <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fcfcfc', borderRadius: '8px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 'bold' }}>Rs {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.specialNotes && (
            <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: '#fffbeb', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
              <strong style={{ color: '#d97706', display: 'block', marginBottom: '0.5rem' }}>Special Notes:</strong> 
              <span style={{ color: '#92400e' }}>{order.specialNotes}</span>
            </div>
          )}

          {order.status === 'pending' && (
            <button className="btn" style={{ background: '#ef4444', color: 'white', width: '100%', padding: '1.2rem', fontSize: '1.1rem', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(239,68,68,0.3)' }} onClick={handleCancel}>
              Cancel Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
