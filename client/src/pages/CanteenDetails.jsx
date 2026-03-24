import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar.jsx';
import './CanteenDetails.css';

const CanteenDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [canteen, setCanteen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCanteen = async () => {
      try {
        const { data } = await api.get(`/canteens/${id}`);
        setCanteen(data);
      } catch (err) {
        console.error('Error fetching canteen details:', err);
        setError('Failed to load canteen details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCanteen();
  }, [id]);

  if (loading) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="canteen-details-loader">
          <div className="spinner"></div>
          <p>Loading Canteen Details...</p>
        </div>
      </div>
    );
  }

  if (error || !canteen) {
    return (
      <div className="app-container">
        <Navbar />
        <div className="canteen-details-error">
          <h2>Oops!</h2>
          <p>{error || 'Canteen not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/canteens')}>
            Back to Canteens
          </button>
        </div>
      </div>
    );
  }

  const isOpen = canteen.status === 'Open';
  const queue = canteen.queue || 'Low';

  return (
    <div className="app-container">
      <Navbar />
      <div className="canteen-details-container">
        <div className="canteen-details-header">
          <button className="back-btn" onClick={() => navigate('/canteens')}>
            ← Back to Directory
          </button>
        </div>

        <div className="canteen-details-card">
          <div className="details-image-section">
            <div className={`status-overlay-badge ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>

          <div className="details-content-section">
            <div className="details-main-info">
              <h1>{canteen.name}</h1>
              <p className="location-text">
                <span className="icon">📍</span> {canteen.location}
              </p>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Opening Hours</span>
                <span className="detail-value">
                  <span className="icon">⏱️</span> {canteen.openTime} - {canteen.closeTime}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Contact Number</span>
                <span className="detail-value">
                  <span className="icon">📞</span> {canteen.contactNumber}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Queue Status</span>
                <div className={`details-queue-badge queue-${queue.toLowerCase()}`}>
                  {queue} Wait Time
                </div>
              </div>

              <div className="detail-item">
                <span className="detail-label">Current Status</span>
                <span className={`status-text ${isOpen ? 'text-open' : 'text-closed'}`}>
                  ● {isOpen ? 'Accepting Orders' : 'Currently Closed'}
                </span>
              </div>
            </div>

            <div className="details-actions">
              <button 
                className="view-menu-btn"
                onClick={() => navigate(`/menu/${canteen._id}`)}
              >
                View Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanteenDetails;
