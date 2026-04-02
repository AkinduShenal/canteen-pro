import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ratingService from '../services/ratingService';
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
  const [pendingRating, setPendingRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fallback high-quality images
  const canteenImages = [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1200',
  ];

  useEffect(() => {
    const fetchCanteen = async () => {
      try {
        const { data } = await api.get(`/canteens/${id}`);
        setCanteen(data);
      } catch (err) {
        console.error('Error fetching canteen details:', err);
        setError('Failed to load canteen details.');
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };

    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const data = await ratingService.getCanteenRatings(id);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchCanteen();
    fetchReviews();
  }, [id]);

  const handleToggleStatus = async () => {
    if (toggling) return;
    try {
      setToggling(true);
      const { data } = await api.put(`/canteens/${id}/status`);
      setCanteen(data);
    } catch (err) {
      console.error('Error toggling status:', err);
    } finally {
      setToggling(false);
    }
  };

  const handleRate = async () => {
    if (!pendingRating) return;
    if (!user) {
      alert('Please login to rate canteens!');
      return;
    }

    try {
      await ratingService.submitRating(id, pendingRating);
      setPendingRating(0); // Clear after submisson
      
      // Refresh canteen stats and reviews
      const { data } = await api.get(`/canteens/${id}`);
      setCanteen(data);
      const reviewsData = await ratingService.getCanteenRatings(id);
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  if (loading) {
    return (
      <div className="details-loader-wrapper">
        <div className="premium-spinner"></div>
        <p>Preparing your view...</p>
      </div>
    );
  }

  if (error || !canteen) {
    return (
      <div className="details-error-page">
        <Navbar />
        <div className="error-content-premium">
          <div className="error-icon">⚠️</div>
          <h2>Canteen Not Found</h2>
          <p>{error || 'The canteen you are looking for does not exist.'}</p>
          <button className="btn-premium-outline" onClick={() => navigate('/canteens')}>
            Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const isOpen = canteen.status === 'Open';
  const queue = canteen.queue || 'Low';
  const imageUrl = canteenImages[Math.floor(Math.random() * canteenImages.length)];

  return (
    <div className="premium-details-root">
      <Navbar />
      
      {/* Immersive Detail Header */}
      <header className="immersive-detail-header">
        <div className="detail-header-image">
          <img src={imageUrl} alt={canteen.name} />
          <div className="detail-header-overlay"></div>
        </div>

        <div className="detail-header-content">
          <button className="premium-back-btn" onClick={() => navigate('/canteens')}>
            <span className="arrow">←</span> <span>Canteen Directory</span>
          </button>
          
          <div className="header-main-title">
            <span className="detail-kicker">Dining Destination</span>
            <h1>{canteen.name}</h1>
            <div className="header-status-row">
              <div className={`exclusive-status-badge ${isOpen ? 'status-online' : 'status-offline'}`}>
                <span className="pulse-dot"></span>
                {isOpen ? 'Live Now' : 'Closed'}
              </div>
              <div className={`queue-indicator-pill queue-${queue.toLowerCase()}`}>
                <span className="queue-dot"></span>
                {queue} Queue
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="detail-main-grid">
        <section className="detail-info-section">
          <div className="info-glass-card">
            <h3>Canteen Information</h3>
            <div className="info-pills-stack">
              <div className="detail-pill-premium">
                <span className="icon">📍</span>
                <div className="pill-text">
                  <label>Location</label>
                  <span>{canteen.location}</span>
                </div>
              </div>
              <div className="detail-pill-premium">
                <span className="icon">🕒</span>
                <div className="pill-text">
                  <label>Service Hours</label>
                  <span>{canteen.openTime} - {canteen.closeTime}</span>
                </div>
              </div>
              <div className="detail-pill-premium">
                <span className="icon">📞</span>
                <div className="pill-text">
                  <label>Contact Support</label>
                  <span>{canteen.contactNumber}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="detail-actions-section">
          <div className="actions-glass-card">
            <h3>Start Your Order</h3>
            <p>Explore the full menu and place your order instantly for a faster pickup experience.</p>
            
            <div className="action-buttons-stack">
              <button 
                className="btn-premium-full"
                onClick={() => navigate(`/menu/${canteen._id}`)}
              >
                View Full Menu
              </button>
              
              {(user?.role === 'staff' || user?.role === 'admin') && (
                <button 
                  className={`btn-premium-secondary ${isOpen ? 'btn-red' : 'btn-green'}`}
                  onClick={handleToggleStatus}
                  disabled={toggling}
                >
                  {toggling ? 'Updating...' : (isOpen ? 'Close Canteen' : 'Open Canteen')}
                </button>
              )}
            </div>
          </div>

          <div className="rating-glass-card">
            <h3>Canteen Feedback</h3>
            <div className="rating-summary-row">
              <span className="rating-avg">⭐ {canteen.averageRating || '0.0'}</span>
              <span className="rating-count">({canteen.totalRatings || 0} reviews)</span>
            </div>

            <div className="stars-interaction">
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span 
                    key={star}
                    className={`star-icon ${star <= (pendingRating || canteen.userRating || 0) ? 'active' : ''} ${pendingRating ? 'is-pending' : ''}`}
                    onClick={() => setPendingRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>
              {pendingRating > 0 && (
                <button className="btn-submit-rating-mini" onClick={handleRate}>
                  Submit Rating
                </button>
              )}
            </div>

            <div className="detailed-reviews-list">
              <h4 className="reviews-subtitle">What students say</h4>
              <div className="reviews-scroll-container">
                {reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div key={r._id} className="review-card-mini">
                      <div className="review-card-head">
                        <span className="review-user">{r.userName}</span>
                        <span className="review-stars">{'★'.repeat(r.rating)}</span>
                      </div>
                      <span className="review-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-reviews-text">No feedback yet. Be the first!</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CanteenDetails;
