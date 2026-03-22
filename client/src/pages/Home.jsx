import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'staff') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
              <Link to="/register" className="btn btn-primary" style={{ width: 'auto', padding: '1.2rem 2.8rem' }}>Get Started Now</Link>
              <Link to="/login" className="btn btn-outline" style={{ width: 'auto', padding: '1.2rem 2.8rem' }}>Sign In</Link>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '2rem 2rem 0' }}>
              <h2 className="text-gradient" style={{ fontSize: '2.5rem' }}>Dashboard</h2>
            </div>
            <div className="welcome-card">
              <div className="avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Welcome back, <span className="text-gradient">{user.name}</span>!</h3>
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '2.5rem', fontSize: '1.2rem' }}>
                Currently logged in as a <span className="user-badge">{user.role}</span>
              </p>
              <button className="btn btn-primary" onClick={logout} style={{ width: 'auto', padding: '1rem 3rem' }}>
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
