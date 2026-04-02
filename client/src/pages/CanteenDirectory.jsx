import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ratingService from '../services/ratingService';
import Navbar from '../components/Navbar.jsx';
import { AuthContext } from '../context/AuthContext.jsx';
import './CanteenDirectory.css';

const CanteenDirectory = () => {
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [queueFilter, setQueueFilter] = useState('All');

  // Fallback high-quality images since the generator is busy
  const canteenImages = [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1000',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=1000',
  ];

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const { data } = await api.get('/canteens');
        setCanteens(data);
      } catch (error) {
        console.error('Error fetching canteens:', error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Smooth transition
      }
    };
    fetchCanteens();
  }, []);

  const toggleReviews = async (e, canteenId) => {
    e.stopPropagation();
    if (expandedReviews[canteenId]) {
      setExpandedReviews(prev => {
        const copy = { ...prev };
        delete copy[canteenId];
        return copy;
      });
      return;
    }

    try {
      setLoadingReviews(prev => ({ ...prev, [canteenId]: true }));
      const details = await ratingService.getCanteenRatings(canteenId);
      setExpandedReviews(prev => ({ ...prev, [canteenId]: details.reviews }));
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(prev => ({ ...prev, [canteenId]: false }));
    }
  };

  const handleRate = async (e, canteenId, rating) => {
    e.stopPropagation(); // Don't navigate to details when rating
    if (!user) {
      alert('Please login to rate canteens!');
      return;
    }

    try {
      await ratingService.submitRating(canteenId, rating);
      // Update local state for instant feedback
      setCanteens(prev => prev.map(c => {
        if (c._id === canteenId) {
          const oldTotal = c.totalRatings || 0;
          const oldAvg = c.averageRating || 0;
          const oldUserRating = c.userRating || 0;
          
          let newTotal = oldTotal;
          let newAvg;
          
          if (oldUserRating === 0) {
            // New rating from this user
            newTotal = oldTotal + 1;
            newAvg = (oldAvg * oldTotal + rating) / newTotal;
          } else {
            // Updated rating
            newAvg = (oldAvg * oldTotal - oldUserRating + rating) / oldTotal;
          }
          
          return {
            ...c,
            averageRating: parseFloat(newAvg.toFixed(1)),
            totalRatings: newTotal,
            userRating: rating
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error submitting rating:', err);
    }
  };

  const filteredCanteens = canteens.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesQueue = queueFilter === 'All' || c.queue === queueFilter;
    return matchesSearch && matchesStatus && matchesQueue;
  });

  if (loading) {
    return (
      <div className="directory-loader-wrapper">
        <div className="premium-loader"></div>
        <p>Polishing your dining experience...</p>
      </div>
    );
  }

  return (
    <div className="directory-page-root">
      <Navbar />
      
      {/* Immersive Hero Section */}
      <section className="directory-hero">
        <div className="hero-background-waves"></div>
        <div className="directory-hero-content">
          <span className="hero-kicker">Premium Dining</span>
          <h1>Explore Campus <span className="text-glow">Canteens</span></h1>
          <p>Find the perfect spot for your next meal with live queue tracking and instant ordering.</p>
          
          <div className="filter-controls-row">
            <div className="search-container-premium">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search canteens..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filters-group-premium">
              <div className="filter-select-wrapper">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="premium-select"
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open Now</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select 
                  value={queueFilter} 
                  onChange={(e) => setQueueFilter(e.target.value)}
                  className="premium-select"
                >
                  <option value="All">All Queues</option>
                  <option value="Low">Low Queue</option>
                  <option value="Medium">Medium Queue</option>
                  <option value="High">High Queue</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="directory-main-container">
        <div className="directory-stats-row">
          <div className="stat-pill">
            <span className="stat-value">{filteredCanteens.length}</span>
            <span className="stat-label">Results</span>
          </div>
          <div className="stat-pill">
            <span className="stat-value">{canteens.filter(c => c.status === 'Open').length}</span>
            <span className="stat-label">Open Now</span>
          </div>
          {(statusFilter !== 'All' || queueFilter !== 'All' || searchTerm) && (
            <button 
              className="clear-filters-btn"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setQueueFilter('All');
              }}
            >
              Clear All
            </button>
          )}
        </div>

        <div className="canteen-immersive-grid">
          {filteredCanteens.length > 0 ? (
            filteredCanteens.map((canteen, index) => {
              const isOpen = canteen.status === 'Open';
              const queue = canteen.queue || 'Low';
              const imageUrl = canteenImages[index % canteenImages.length];
              
              return (
                <div 
                  key={canteen._id} 
                  className={`immersive-card ${!isOpen ? 'card-dimmed' : ''}`}
                  onClick={() => navigate(`/canteen/${canteen._id}`)}
                >
                  <div className="card-image-wrapper">
                    <img src={imageUrl} alt={canteen.name} loading="lazy" />
                    <div className="card-image-overlay"></div>
                    <div className={`exclusive-status-badge ${isOpen ? 'status-online' : 'status-offline'}`}>
                      <span className="pulse-dot"></span>
                      {isOpen ? 'Live Now' : 'Closed'}
                    </div>
                  </div>
                  
                  <div className="card-glass-content">
                    <div className="card-header-row">
                      <h2>{canteen.name}</h2>
                      <div className={`queue-indicator queue-${queue.toLowerCase()}`}>
                        <span className="queue-dot"></span>
                        {queue} Queue
                      </div>
                    </div>

                    <div className="card-rating-container">
                      <div className="card-rating-summary">
                        <span className="star-avg">⭐ {canteen.averageRating || '0.0'}</span>
                        <span className="review-count">({canteen.totalRatings || 0} reviews)</span>
                        <button 
                          className="btn-view-reviews" 
                          onClick={(e) => toggleReviews(e, canteen._id)}
                        >
                          {expandedReviews[canteen._id] ? 'Hide Reviews' : 'View Reviews'}
                        </button>
                      </div>

                      <div className="interactive-stars" onClick={(e) => e.stopPropagation()}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star}
                            className={`star-icon ${star <= (canteen.userRating || 0) ? 'active' : ''}`}
                            onClick={(e) => handleRate(e, canteen._id, star)}
                          >
                            ★
                          </span>
                        ))}
                        {!user && <span className="rate-tooltip">Login to rate</span>}
                      </div>

                      {expandedReviews[canteen._id] && (
                        <div className="card-reviews-list" onClick={(e) => e.stopPropagation()}>
                          <div className="reviews-scroll">
                            {expandedReviews[canteen._id].length > 0 ? (
                              expandedReviews[canteen._id].map(review => (
                                <div key={review._id} className="review-item">
                                  <div className="review-user-row">
                                    <span className="review-user">{review.userName}</span>
                                    <span className="review-stars">{'★'.repeat(review.rating)}</span>
                                  </div>
                                  <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                              ))
                            ) : (
                              <p className="no-reviews">No reviews yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="card-info-grid">
                      <div className="info-pill">
                        <span className="icon">📍</span>
                        <span>{canteen.location}</span>
                      </div>
                      <div className="info-pill">
                        <span className="icon">🕒</span>
                        <span>{canteen.openTime} - {canteen.closeTime}</span>
                      </div>
                    </div>

                    <div className="card-footer-action">
                      <span className="action-text">Explore Menu</span>
                      <span className="action-arrow">→</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-results-premium">
              <div className="no-results-icon">🍽️</div>
              <h3>No Canteens Found</h3>
              <p>We couldn't find any canteens matching your filters. Try adjusting your search.</p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '2rem' }}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setQueueFilter('All');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CanteenDirectory;
