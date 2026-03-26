import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { CartContext } from '../context/CartContext.jsx';
import CartDrawer from './CartDrawer.jsx';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getCartCount = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((acc, item) => acc + item.quantity, 0);
  };

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke="currentColor"/>
          <path d="M7 2v20" stroke="currentColor"/>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" stroke="currentColor"/>
        </svg>
        CanteenPro
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/menu" className="nav-link">Menu</Link>
        {user ? (
          <>
            <Link to="/canteens" className="nav-link">Canteens</Link>
            {user.role === 'staff' && (
              <Link to="/staff/canteens" className="nav-link staff-manage-link">
                Manage Canteens
              </Link>
            )}
            {(user.role === 'staff' || user.role === 'admin') ? (
              <>
                <Link to="/staff/category-management" className="nav-link">Manage Categories</Link>
                <Link to="/staff/menu-management" className="nav-link">Manage Items</Link>
              </>
            ) : null}
            <Link to="/myorders" className="nav-link">My Orders</Link>
            <button 
              className="nav-link" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: '500' }} 
              onClick={() => setIsCartOpen(true)}
            >
              🛒 Cart
              {getCartCount() > 0 && (
                <span style={{
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '0.15rem 0.6rem',
                  borderRadius: '50px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  minWidth: '22px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px var(--primary-glow)',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  {getCartCount()}
                </span>
              )}
            </button>
            <Link to="/profile" className="nav-link">Profile</Link>
            <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.6rem 1.5rem', borderWidth: '2px', cursor: 'pointer' }}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link btn-outline btn" style={{ padding: '0.6rem 1.5rem', borderWidth: '2px' }}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', width: 'auto' }}>Register</Link>
          </>
        )}
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </nav>
  );
};

export default Navbar;
