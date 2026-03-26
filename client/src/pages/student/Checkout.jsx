import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import api from '../../services/api';

const Checkout = () => {
  const { cart, cartTotal, fetchCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [pickupTime, setPickupTime] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return null;

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Checkout</h2>
        
        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
          {/* Form */}
          <div className="checkout-form" style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Order Details</h3>
            
            <form onSubmit={handlePlaceOrder}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '600' }}>Pickup Time Slot</label>
                <select 
                  className="form-control" 
                  value={pickupTime} 
                  onChange={(e) => setPickupTime(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a 15-minute slot</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <small style={{ color: 'gray', marginTop: '0.25rem', display: 'block' }}>Slots are limited to 20 orders per timeframe.</small>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: '600' }}>Special Notes (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows="3" 
                  placeholder="e.g., Less spicy, extra sauce"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
                {loading ? 'Processing...' : `Place Order (Rs ${cartTotal.toFixed(2)})`}
              </button>
            </form>
          </div>

          {/* Cart Summary */}
          <div className="checkout-summary" style={{ background: '#f8f9fa', padding: '2rem', borderRadius: '12px', border: '1px solid #eee' }}>
            <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Your Items</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {cart.items.map(item => (
                <div key={item.menuItem._id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity}x {item.menuItem.name}</span>
                  <span style={{ fontWeight: '500' }}>Rs {(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px dashed #ddd', paddingTop: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
              <span>Total Amount</span>
              <span style={{ color: 'var(--primary)' }}>Rs {cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
