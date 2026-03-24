import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar.jsx';
import './CanteenDirectory.css';

const CanteenDirectory = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCanteens = async () => {
      try {
        const { data } = await api.get('/canteens');
        setCanteens(data);
      } catch (error) {
        console.error('Error fetching canteens:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCanteens();
  }, []);

  if (loading) {
    return <div className="canteen-directory-loader">Loading Canteens...</div>;
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="canteen-directory-container">
        <div className="canteen-directory-header">
          <h1>Campus Canteens</h1>
          <p>Explore all dining options across the university campus</p>
        </div>
        
        <div className="canteen-grid">
          {canteens.map((canteen) => {
            const isOpen = canteen.status === 'Open';
            const queue = canteen.queue || 'Low';
            
            return (
              <div key={canteen._id} className="canteen-card">
                <div className="canteen-card-image">
                  <div className={`status-badge ${isOpen ? 'open' : 'closed'}`}>
                    {isOpen ? 'Open Now' : 'Closed'}
                  </div>
                </div>
                <div className="canteen-card-content">
                  <h2>{canteen.name}</h2>
                  <div className="canteen-info">
                    <div className="info-item">
                      <span className="icon">📍</span>
                      <span>{canteen.location}</span>
                    </div>
                    <div className="info-item">
                      <span className="icon">⏱️</span>
                      <span>{canteen.openTime} - {canteen.closeTime}</span>
                    </div>
                    <div className="info-item">
                      <span className="icon">📞</span>
                      <span>{canteen.contactNumber}</span>
                    </div>
                    <div className={`queue-badge queue-${queue.toLowerCase()}`}>
                      Queue: {queue}
                    </div>
                  </div>
                  <button 
                    className="view-details-btn"
                    onClick={() => navigate(`/canteen/${canteen._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CanteenDirectory;
