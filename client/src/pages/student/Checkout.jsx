import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import api from '../../services/api';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartTotal, fetchCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [pickupTime, setPickupTime] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedSlot, setSuggestedSlot] = useState(null);

  // Guard: if cart is empty, go back
  useEffect(() => {
    if (cart && (!cart.items || cart.items.length === 0)) {
      navigate('/menu');
    }
  }, [cart, navigate]);

  const generateTimeSlots = () => {
    // Generate valid times from 10:00 to 18:00
    const slots = [];
    for (let h = 10; h <= 17; h++) {
      for (let m = 0; m < 60; m += 15) {
        let nextM = m + 15;
        let nextH = h;
        if (nextM === 60) {
          nextM = 0;
          nextH = h + 1;
        }
        const start = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const end = `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`;
        slots.push(`${start} - ${end}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setSuggestedSlot(null);
    
    if (!pickupTime) {
      setError('Please select a pickup time slot');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/orders', {
        pickupTime,
        specialNotes
      });
      
      // Order success! Re-fetch cart (to clear it in context)
      await fetchCart();
      // Navigate to order success/tracking page
      navigate(`/orders/${data._id}`);
    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.message || 'Failed to place order');
      if (errData?.slotFull && errData?.nextAvailableSlot) {
        setSuggestedSlot(errData.nextAvailableSlot);
      }
    } finally {
      setLoading(false);
    }
  };

  const applySlotSuggestion = () => {
    setPickupTime(suggestedSlot);
    setSuggestedSlot(null);
    setError('');
  };

  if (!cart) return null;

  return (
    <div className="app-container">
      <Navbar />
      <main className="checkout-page">
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <p className="home-kicker">Secure Checkout</p>
          <h1 style={{ fontSize: '3.5rem', marginTop: '1rem' }}>Complete Your Order</h1>
          <p style={{ maxWidth: '600px', margin: '1rem auto' }}>Review your items and select a convenient pickup time slot below.</p>
        </header>
        
        {error && !suggestedSlot && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1.2rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #f87171', textAlign: 'center', fontWeight: '500' }}>
            ⚠️ {error}
          </div>
        )}

        {suggestedSlot && (
          <div style={{
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            border: '1.5px solid #f59e0b',
            borderRadius: '14px',
            padding: '1.4rem 1.8rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: '0 4px 16px rgba(245,158,11,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.6rem' }}>⏰</span>
              <div>
                <div style={{ fontWeight: '700', color: '#92400e', fontSize: '0.95rem' }}>That slot is full!</div>
                <div style={{ color: '#78350f', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  Next available: <strong>{suggestedSlot}</strong>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={applySlotSuggestion}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '0.65rem 1.5rem',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              Use This Slot →
            </button>
          </div>
        )}

        <div className="checkout-grid">
          {/* Form */}
          <div className="checkout-card">
            <h3 className="checkout-section-title">
              <span>🕒</span> Pickup Details
            </h3>
            
            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label>Select Pickup Time Slot</label>
                <select 
                  className="form-select" 
                  value={pickupTime} 
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose a 15-minute window</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.9rem', marginTop: '0.7rem', color: 'var(--text-light)' }}>
                  📝 Slots are limited to ensure fresh preparation.
                </p>
              </div>

              <div className="form-group">
                <label>Special Instructions (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Example: No onions, extra spicy, or deliver to gate..."
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-checkout" disabled={loading}>
                {loading ? 'Processing...' : `Confirm Order • Rs ${cartTotal.toFixed(2)}`}
              </button>
            </form>
          </div>

          {/* Cart Summary */}
          <div className="order-summary-card">
            <h3 className="checkout-section-title" style={{ fontSize: '1.4rem' }}>
              <span>🛒</span> Your Order
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cart.items.map(item => (
                <div key={item.menuItem._id} className="summary-item">
                  <div className="summary-item-info">
                    {item.menuItem.image ? (
                      <img src={item.menuItem.image} alt={item.menuItem.name} className="summary-item-img" />
                    ) : (
                      <div className="summary-item-img" style={{ background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🍽️</div>
                    )}
                    <div>
                      <div className="summary-item-name">{item.menuItem.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: '600' }}>Rs {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-total">
              <span>Total Amount</span>
              <span className="price">Rs {cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
