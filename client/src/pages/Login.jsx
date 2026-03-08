import React from 'react';
import Navbar from '../components/Navbar.jsx';

const Login = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content auth-container">
        <div className="glass-card">
          <div className="form-header">
            <h2 className="text-gradient">Welcome Back</h2>
            <p>Please enter your details to sign in</p>
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
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
