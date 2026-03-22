import React, { useState, useContext } from 'react';
import Navbar from '../components/Navbar.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const Login = () => {
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
      const { data } = await api.post('/auth/login', { email, password });
      login(data); // Save to context and localStorage

      if (data?.role === 'admin' || data?.role === 'staff') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f87171' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
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
                  className="form-control" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
              
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
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
