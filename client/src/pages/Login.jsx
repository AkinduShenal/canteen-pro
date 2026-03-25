import React, { useState, useContext } from 'react';
import Navbar from '../components/Navbar.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleRole, setGoogleRole] = useState('student');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data); // Save to context and localStorage
      
      // after successful login
      localStorage.setItem("token", res.data.token);

      // redirect
      window.location.href = "/canteens";
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/google', { 
        token: credentialResponse.credential,
        role: googleRole 
      });
      login(res.data);
      localStorage.setItem("token", res.data.token);
      window.location.href = "/canteens";
    } catch (err) {
      setError('Google Sign-In failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was unsuccessful.');
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
              
              <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', textAlign: 'center', color: 'var(--text-light)' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }}></div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.8rem' }}>
                  Sign in with Google as:
                </label>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${googleRole === 'student' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                    onClick={() => setGoogleRole('student')}
                  >
                    Student
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${googleRole === 'staff' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                    onClick={() => setGoogleRole('staff')}
                  >
                    Staff
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <GoogleLogin 
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_blue"
                  shape="rectangular"
                  width="100%"
                />
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
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
