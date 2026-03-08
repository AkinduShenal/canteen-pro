import React from 'react';
import Navbar from '../components/Navbar.jsx';

const Login = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content auth-container">
        <div className="glass-card">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Sign in to order your favorite meals</p>
          </div>
          <form>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder="Enter your email" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Enter your password" required />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              Sign In
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span style={{ color: 'var(--text-light)' }}>Don't have an account? </span>
              <a href="/register" style={{ fontWeight: '600' }}>Create one here</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
