import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser, deleteUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await api.put('/auth/profile', { name, email, password });
      updateUser(data);
      setSuccess('Profile updated successfully!');
      setPassword(''); // Clear password field after update
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/profile');
        deleteUser();
        navigate('/register');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete profile');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <Link to="/canteens" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem', transition: 'color 0.2s' }}>
              <span style={{ marginRight: '0.5rem', fontSize: '1.2rem' }}>←</span> Back to Canteens
            </Link>
          </div>
          <div className="form-header" style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              margin: '0 auto 1rem',
              boxShadow: 'var(--shadow-md)'
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2>My Profile</h2>
            <p>Manage your account settings</p>
          </div>

          {error && <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #f87171' }}>{error}</div>}
          {success && <div style={{ backgroundColor: '#dcfce7', color: '#16a34a', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #86efac' }}>{success}</div>}

          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                type="password" 
                className={`form-control ${password.length > 10 ? 'error' : ''}`}
                placeholder="Leave blank to keep current (6-10 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
              />
              {password.length > 10 && (
                <small style={{ color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>
                  Password cannot exceed 10 characters
                </small>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading || (password.length > 0 && (password.length < 6 || password.length > 10))}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '0.9rem' }}>Danger Zone</p>
            <button onClick={handleDelete} className="btn" style={{ backgroundColor: '#ef4444', color: 'white', width: '100%' }}>
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
