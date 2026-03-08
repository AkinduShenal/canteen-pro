import React from 'react';
import Navbar from '../components/Navbar.jsx';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content auth-container">
        <div className="auth-card-split">
          {/* Form Side (Swapped for variety) */}
          <div className="auth-form-side">
            <div className="form-header">
              <h2>Join Us</h2>
              <p>Create an account to order fresh meals</p>
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
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                Create Account
              </button>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <span style={{ color: 'var(--text-light)' }}>Already have an account? </span>
                <Link to="/login" style={{ fontWeight: '600' }}>Sign In</Link>
              </div>
            </form>
          </div>

          {/* Image Side */}
          <div className="auth-image-side" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505935428862-770b6f24f629?q=80&w=1200&auto=format&fit=crop')" }}>
            <div className="auth-image-content">
              <h3>Fresh & Fast</h3>
              <p>Skip the line and get back to your studies with CanteenPro's seamless ordering.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
