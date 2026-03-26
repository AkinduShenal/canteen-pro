import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext.jsx';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, cartTotal, updateQuantity, removeFromCart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Order</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="cart-content">
          {!cart || !cart.items || cart.items.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <button className="btn btn-outline" onClick={onClose} style={{ marginTop: '1rem' }}>Browse Menu</button>
            </div>
          ) : (
            <>
              <div className="cart-items-list">
                {cart.items.map((item) => (
                  <div key={item.menuItem._id} className="cart-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                      {item.menuItem.image ? (
                        <img 
                          src={item.menuItem.image} 
                          alt={item.menuItem.name} 
                          className="cart-item-image"
                        />
                      ) : (
                        <div className="cart-item-placeholder">🍽️</div>
                      )}
                      <div className="cart-item-info">
                        <h4>{item.menuItem.name}</h4>
                        <p className="price">
                          Rs {item.menuItem.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-controls">
                        <button onClick={() => updateQuantity(item.menuItem._id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItem._id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(item.menuItem._id)} title="Remove item">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="cart-total">
                  <span>Subtotal</span>
                  <span className="amount">Rs {cartTotal.toFixed(2)}</span>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem' }} onClick={handleCheckout}>
                  Proceed to Checkout
                </button>
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button className="btn-link" onClick={clearCart}>
                    Clear Cart
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
