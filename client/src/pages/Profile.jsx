import React, { useState, useContext, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import * as userService from '../services/userService.js';
import { useNavigate, Link } from 'react-router-dom';

const Profile = () => {
  const { user, updateUser, deleteUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    profilePicture: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'student',
          profilePicture: data.profilePicture || ''
        });
        if (data.profilePicture) {
          setPreviewUrl(data.profilePicture.startsWith('http') ? data.profilePicture : `http://localhost:5000${data.profilePicture}`);
        }
      } catch (err) {
        setError('Failed to fetch profile data');
      } finally {
        setFetching(false);
      }
    };

    if (!user) {
      navigate('/login');
    } else {
      fetchProfile();
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      return false;
    }
    return true;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      if (selectedFile) {
        data.append('profileImage', selectedFile);
      }

      const updatedData = await userService.updateProfile(data);
      
      // Update context - we need to preserve the token
      const newUser = { ...user, ...updatedData };
      updateUser(newUser);
      
      setFormData(prev => ({
        ...prev,
        ...updatedData
      }));
      
      if (updatedData.profilePicture) {
        setPreviewUrl(updatedData.profilePicture.startsWith('http') ? updatedData.profilePicture : `http://localhost:5000${updatedData.profilePicture}`);
      }

      setSuccess('Profile updated successfully!');
      setSelectedFile(null);
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

  if (!user || fetching) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ maxWidth: '600px', width: '100%', position: 'relative' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Link to="/" style={{ color: 'var(--primary-color)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>←</span> Back to Home
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 1rem' }}>
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid var(--primary-color)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6'
              }}>
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <span style={{ fontSize: '4rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                    {formData.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={{
                  position: 'absolute',
                  bottom: '5px',
                  right: '5px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  zIndex: 2
                }}
                title="Change Profile Picture"
              >
                📸
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
                accept="image/*"
              />
            </div>
            
            <h2 style={{ margin: '0.5rem 0' }}>{formData.name}</h2>
            <div style={{
              display: 'inline-block',
              padding: '0.25rem 1rem',
              borderRadius: '50px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {formData.role}
            </div>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#fee2e2', 
              color: '#dc2626', 
              padding: '1rem', 
              borderRadius: 'var(--radius-sm)', 
              marginBottom: '1.5rem', 
              border: '1px solid #f87171',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ 
              backgroundColor: '#dcfce7', 
              color: '#16a34a', 
              padding: '1rem', 
              borderRadius: 'var(--radius-sm)', 
              marginBottom: '1.5rem', 
              border: '1px solid #86efac',
              textAlign: 'center'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleUpdate} style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>Full Name</label>
              <input 
                type="text" 
                name="name"
                className="form-control" 
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>Email Address (Read-only)</label>
              <input 
                type="email" 
                className="form-control" 
                value={formData.email}
                disabled
                style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed', color: '#6b7280' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '600' }}>Phone Number</label>
              <input 
                type="tel" 
                name="phone"
                className={`form-control ${formData.phone && !/^\d{10}$/.test(formData.phone) ? 'error' : ''}`}
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. 0771234567"
                maxLength="10"
              />
              <small style={{ color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>
                Must be 10 digits
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', marginTop: '1rem', borderRadius: 'var(--radius-md)' }} 
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <div className="spinner-small"></div> Updating...
                </div>
              ) : 'Update Profile'}
            </button>
          </form>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>Account Management</p>
            <button onClick={handleDelete} className="btn" style={{ 
              backgroundColor: 'transparent', 
              color: '#ef4444', 
              border: '1px solid #ef4444',
              width: '100%',
              padding: '0.8rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: '600'
            }}>
              Delete My Account
            </button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(232, 93, 4, 0.1);
          border-top-color: var(--primary-color);
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #white;
          border-radius: 50%;
          animation: spin 1s infinite linear;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .form-control.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `}} />
    </div>
  );
};

export default Profile;

