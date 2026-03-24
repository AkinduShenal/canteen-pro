import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './CanteenDirectory.css';

const CanteenDirectory = () => {
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

  // Simple mock to check if open based on time roughly, 
  // for a real app we would parse strict dates. 
  // Here we just randomly pick open or closed to showcase UI state
  // or just say Open if it's currently between 8am and 8pm.
  const checkIfOpen = (openTime, closeTime) => {
    const currHour = new Date().getHours();
    return currHour >= 7 && currHour <= 21; // Mock check for demonstration
  };

  const getQueueStatus = () => {
    const statuses = ['Low', 'Medium', 'High'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  if (loading) {
    return <div className="canteen-directory-loader">Loading Canteens...</div>;
  }

  return (
    <div className="canteen-directory-container">
      <div className="canteen-directory-header">
        <h1>Campus Canteens</h1>
        <p>Explore all dining options across the university campus</p>
      </div>
      
      <div className="canteen-grid">
        {canteens.map((canteen) => {
          const isOpen = checkIfOpen(canteen.openTime, canteen.closeTime);
          const queue = getQueueStatus();
          
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
                <button className="view-details-btn">View Details</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CanteenDirectory;
