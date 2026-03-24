import React, { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * CanteenForm Component
 * Used for both adding a new canteen and editing an existing one.
 * 
 * @param {Object} props
 * @param {Object} props.canteen - Existing canteen data (if editing)
 * @param {Function} props.onSuccess - Callback after successful submission
 * @param {Function} props.onCancel - Callback if user cancels
 */
const CanteenForm = ({ canteen, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    openTime: '08:00',
    closeTime: '20:00',
    contactNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preload data if editing an existing canteen
  useEffect(() => {
    if (canteen) {
      setFormData({
        name: canteen.name || '',
        location: canteen.location || '',
        openTime: canteen.openTime || '08:00',
        closeTime: canteen.closeTime || '20:00',
        contactNumber: canteen.contactNumber || ''
      });
    } else {
      // Reset form if no canteen (adding new)
      setFormData({
        name: '',
        location: '',
        openTime: '08:00',
        closeTime: '20:00',
        contactNumber: ''
      });
    }
  }, [canteen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (canteen && canteen._id) {
        // Update existing canteen
        await api.put(`/canteens/${canteen._id}`, formData);
      } else {
        // Create new canteen
        await api.post('/canteens', formData);
      }
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error saving canteen:', err);
      setError(err.response?.data?.message || 'Failed to save canteen. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="management-form">
      {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name">Canteen Name</label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g. Central Canteen"
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            placeholder="e.g. Level 1, Block A"
          />
        </div>

        <div className="form-group">
          <label htmlFor="openTime">Open Time</label>
          <input
            id="openTime"
            type="time"
            name="openTime"
            value={formData.openTime}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="closeTime">Close Time</label>
          <input
            id="closeTime"
            type="time"
            name="closeTime"
            value={formData.closeTime}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="contactNumber">Contact Number</label>
          <input
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleInputChange}
            required
            placeholder="e.g. 011-2345678"
          />
        </div>
      </div>

      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : canteen ? 'Update Canteen' : 'Add Canteen'}
        </button>
      </div>
    </form>
  );
};

export default CanteenForm;
