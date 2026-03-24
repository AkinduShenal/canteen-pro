import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar.jsx';
import CanteenForm from '../components/CanteenForm.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import './StaffCanteenManagement.css';

const StaffCanteenManagement = () => {
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCanteen, setEditingCanteen] = useState(null);
  const [canteenToDelete, setCanteenToDelete] = useState(null);

  const { user } = useContext(AuthContext);
  useEffect(() => {
    fetchCanteens();
  }, []);

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

  const openAddModal = () => {
    setEditingCanteen(null);
    setIsModalOpen(true);
  };

  const openEditModal = (canteen) => {
    setEditingCanteen(canteen);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchCanteens();
  };

  const openDeleteModal = (canteen) => {
    setCanteenToDelete(canteen);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!canteenToDelete) return;
    try {
      await api.delete(`/canteens/${canteenToDelete._id}`);
      setIsDeleteModalOpen(false);
      fetchCanteens();
    } catch (err) {
      console.error('Error deleting canteen:', err);
      alert('Error deleting canteen.');
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
                          <button className="btn-icon delete" onClick={() => openDeleteModal(canteen)} title="Delete">
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
              <CanteenForm 
                canteen={editingCanteen} 
                onSuccess={handleFormSuccess} 
                onCancel={() => setIsModalOpen(false)} 
              />
            </div>
          </div>
        )}

        {isDeleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal">
              <div className="modal-header">
                <h2>Delete Confirmation</h2>
                <button className="close-btn" onClick={() => setIsDeleteModalOpen(false)}>&times;</button>
              </div>
              <div className="delete-body">
                <div className="warning-icon">⚠️</div>
                <p>Are you sure you want to delete the canteen <strong>{canteenToDelete?.name}</strong>?</p>
                <p className="description">This action cannot be undone and all data associated with this canteen will be removed.</p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete Canteen</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffCanteenManagement;
