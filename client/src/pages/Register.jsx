import React from 'react';
import Navbar from '../components/Navbar.jsx';

const Register = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content auth-container">
        <div className="glass-card">
          <div className="form-header">
            <h2>Create an Account</h2>
            <p>Join CanteenPro today for fresh meals</p>
          </div>
          <form>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" placeholder="Enter your full name" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-control" placeholder="Enter your email" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-control" placeholder="Create a password" required />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
              Create Account
            </button>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span style={{ color: 'var(--text-light)' }}>Already have an account? </span>
              <a href="/login" style={{ fontWeight: '600' }}>Sign In here</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
