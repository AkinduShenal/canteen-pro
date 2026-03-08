import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
          <defs>
            <linearGradient id="brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary-color)" />
              <stop offset="100%" stopColor="var(--accent-color)" />
            </linearGradient>
          </defs>
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke="url(#brand-gradient)"/>
          <path d="M7 2v20" stroke="url(#brand-gradient)"/>
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" stroke="url(#brand-gradient)"/>
        </svg>
        CanteenPro
      </Link>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/login" className="nav-link btn-outline btn" style={{ padding: '0.5rem 1.2rem', borderWidth: '1px' }}>Login</Link>
        <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1.2rem', width: 'auto' }}>Register</Link>
      </div>
    </nav>
  );
};

export default Navbar;
