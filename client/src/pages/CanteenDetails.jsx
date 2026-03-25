import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import './CanteenDetails.css';

const CanteenDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [canteen, setCanteen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);

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

  const handleToggleStatus = async () => {
    if (toggling) return;
    try {
      setToggling(true);
      const { data } = await api.put(`/canteens/${id}/status`);
      setCanteen(data);
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Failed to update canteen status.');
    } finally {
      setToggling(false);
    }
  };

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

  const heroImage =
    canteen.name?.toLowerCase().includes('basement')
      ? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format&fit=crop'
      : canteen.name?.toLowerCase().includes('new')
        ? 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1600&auto=format&fit=crop'
        : canteen.name?.toLowerCase().includes('anohana')
          ? 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600&auto=format&fit=crop'
          : 'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1600&auto=format&fit=crop';

  return (
    <div className="app-container">
      <Navbar />
      <div className="canteen-details-page">
        <div className="canteen-details-shell">
          <div className="canteen-details-back-row">
            <button className="back-btn" onClick={() => navigate('/canteens')}>
              ← Back to Directory
            </button>
            <div className={`status-overlay-badge ${isOpen ? 'open' : 'closed'}`}>
              {isOpen ? 'Open Now' : 'Closed'}
            </div>
          </div>

          <div className="canteen-details-hero-grid">
            <aside className="canteen-details-visual-panel">
              <img src={heroImage} alt={canteen.name} className="canteen-details-hero-image" />
              <div className="canteen-details-visual-overlay">
                <p>Campus dining experience</p>
                <h2>{canteen.name}</h2>
                <span>{isOpen ? 'Serving now' : 'Temporarily closed'}</span>
              </div>
            </aside>

            <section className="canteen-details-info-panel">
              <div className="details-main-info">
                <p className="details-kicker">Canteen profile</p>
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

              <div className="details-extra-strip">
                <article>
                  <span>Queue</span>
                  <strong>{queue}</strong>
                </article>
                <article>
                  <span>Hours</span>
                  <strong>{canteen.openTime} - {canteen.closeTime}</strong>
                </article>
                <article>
                  <span>Status</span>
                  <strong>{isOpen ? 'Open' : 'Closed'}</strong>
                </article>
              </div>

              <div className="details-actions">
                <button
                  className="view-menu-btn"
                  onClick={() => navigate(`/menu/${canteen._id}`)}
                >
                  View Menu
                </button>

                {(user?.role === 'staff' || user?.role === 'admin') && (
                  <button
                    className={`quick-toggle-btn ${isOpen ? 'close' : 'open'}`}
                    onClick={handleToggleStatus}
                    disabled={toggling}
                  >
                    {toggling ? 'Updating...' : (isOpen ? 'Close Canteen' : 'Open Canteen')}
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanteenDetails;
