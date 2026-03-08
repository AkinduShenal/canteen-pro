import React from 'react';
import Navbar from '../components/Navbar.jsx';
import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content auth-container">
        <div className="auth-card-split">
          {/* Image Side */}
          <div className="auth-image-side" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop')" }}>
            <div className="auth-image-content">
              <h3>Welcome Back!</h3>
              <p>Sign in to discover daily specials and pre-order your favorite campus meals.</p>
            </div>
          </div>
          
          {/* Form Side */}
          <div className="auth-form-side">
            <div className="form-header">
              <h2>Sign In</h2>
              <p>Enter your details to access your account</p>
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
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }}>
                Sign In
              </button>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <span style={{ color: 'var(--text-light)' }}>Don't have an account? </span>
                <Link to="/register" style={{ fontWeight: '600' }}>Create one</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
