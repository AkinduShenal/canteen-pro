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
            <h1 className="hero-title">Delicious Meals, Just a Click Away</h1>
            <p className="hero-subtitle">
              Pre-order your favorite campus meals from CanteenPro and skip the lines. 
              Fresh ingredients, fast service, and a modern experience.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/register" className="btn btn-primary" style={{ width: 'auto' }}>Get Started</Link>
              <Link to="/login" className="btn btn-outline" style={{ width: 'auto', backgroundColor: 'white' }}>Login</Link>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Dashboard</h2>
            </div>
            <div className="welcome-card">
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1rem', fontWeight: 'bold' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Welcome back, {user.name}!</h3>
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                You are logged in as a <span className="user-badge">{user.role}</span>
              </p>
              <button className="btn btn-outline" onClick={logout} style={{ width: 'auto' }}>Sign Out</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
