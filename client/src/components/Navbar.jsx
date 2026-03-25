import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    </nav>
  );
};

export default Navbar;
