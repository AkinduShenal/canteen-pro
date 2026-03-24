import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import './StaffCanteenManagement.css';

const StaffCanteenManagement = () => {
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    openTime: '08:00',
    closeTime: '20:00',
    contactNumber: ''
  });

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'staff' && user.role !== 'admin')) {
      navigate('/canteens');
      return;
    }
    fetchCanteens();
  }, [user, navigate]);

  const fetchCanteens = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/canteens');
      setCanteens(data);
    } catch (err) {
      console.error('Error fetching canteens:', err);
      setError('Failed to load canteens.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setEditingCanteen(null);
    setFormData({
      name: '',
      location: '',
      openTime: '08:00',
      closeTime: '20:00',
      contactNumber: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (canteen) => {
    setEditingCanteen(canteen);
    setFormData({
      name: canteen.name,
      location: canteen.location,
      openTime: canteen.openTime,
      closeTime: canteen.closeTime,
      contactNumber: canteen.contactNumber
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCanteen) {
        await api.put(`/canteens/${editingCanteen._id}`, formData);
      } else {
        await api.post('/canteens', formData);
      }
      setIsModalOpen(false);
      fetchCanteens();
    } catch (err) {
      console.error('Error saving canteen:', err);
      alert(err.response?.data?.message || 'Error saving canteen.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this canteen?')) {
      try {
        await api.delete(`/canteens/${id}`);
        fetchCanteens();
      } catch (err) {
        console.error('Error deleting canteen:', err);
        alert('Error deleting canteen.');
      }
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="management-container">
        <header className="management-header">
          <div>
            <h1>Staff Canteen Management</h1>
            <p className="subtitle">Manage campus canteens and their availability</p>
          </div>
          <button className="btn btn-primary add-btn" onClick={openAddModal}>
            <span className="icon">+</span> Add New Canteen
          </button>
        </header>

        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading canteens...</p>
          </div>
        ) : error ? (
          <div className="error-card">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Canteen Name</th>
                  <th>Location</th>
                  <th>Operating Hours</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {canteens.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No canteens found. Add one to get started!</td>
                  </tr>
                ) : (
                  canteens.map((canteen) => (
                    <tr key={canteen._id}>
                      <td className="font-bold">{canteen.name}</td>
                      <td>{canteen.location}</td>
                      <td>
                        <span className="badge-time">{canteen.openTime} - {canteen.closeTime}</span>
                      </td>
                      <td>{canteen.contactNumber}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-icon edit" onClick={() => openEditModal(canteen)} title="Edit">
                            ✎
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(canteen._id)} title="Delete">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingCanteen ? 'Edit Canteen' : 'Add New Canteen'}</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="management-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Canteen Name" />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input name="location" value={formData.location} onChange={handleInputChange} required placeholder="Building / Floor" />
                  </div>
                  <div className="form-group">
                    <label>Open Time</label>
                    <input type="time" name="openTime" value={formData.openTime} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label>Close Time</label>
                    <input type="time" name="closeTime" value={formData.closeTime} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group full-width">
                    <label>Contact Number</label>
                    <input name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required placeholder="011-XXXXXXX" />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingCanteen ? 'Update Canteen' : 'Saves Canteen'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffCanteenManagement;
