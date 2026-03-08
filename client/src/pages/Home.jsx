import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const Home = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        {!user ? (
          <div className="hero-section">
            <h1 className="hero-title">Delicious Meals,<br />Just a Click Away</h1>
            <p className="hero-subtitle">
              Pre-order your favorite campus meals from CanteenPro and skip the lines. 
              Fresh ingredients, fast service, and a modern experience.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary" style={{ width: 'auto', padding: '1rem 2rem' }}>Get Started Now</Link>
              <Link to="/login" className="btn btn-outline" style={{ width: 'auto', padding: '1rem 2rem' }}>Sign In</Link>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="text-gradient">Dashboard</h2>
            </div>
            <div className="welcome-card">
              <div className="avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.8rem' }}>Welcome back, <span className="text-gradient">{user.name}</span>!</h3>
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                You are currently logged in as a <span className="user-badge">{user.role}</span>
              </p>
              <button className="btn btn-outline" onClick={logout} style={{ width: 'auto', padding: '0.8rem 2rem' }}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
