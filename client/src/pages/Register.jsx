import React, { useState, useContext } from 'react';
import Navbar from '../components/Navbar.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      login(data); // Save to context and localStorage
      navigate('/canteens'); // Redirect to Canteen Directory
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content auth-container">
        <div className="auth-card-split">
          {/* Form Side */}
          <div className="auth-form-side">
            <div className="form-header">
              <h2>Join Us</h2>
              <p>Create an account to order fresh meals</p>
            </div>
            
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f87171' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter your full name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Enter your email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className={`form-control ${password.length > 10 ? 'error' : ''}`}
                  placeholder="Create a password (6-10 chars)" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  minLength="6"
                />
                {password.length > 10 && (
                  <small style={{ color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>
                    Password cannot exceed 10 characters
                  </small>
                )}
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading || password.length < 6 || password.length > 10}>
                {loading ? 'Creating Account...' : 'Create Account'}
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
