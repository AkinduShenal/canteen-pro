import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar.jsx';
import './CanteenDirectory.css';

const CanteenDirectory = () => {
  const navigate = useNavigate();
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCanteens = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return canteens;

    return canteens.filter((canteen) => {
      const haystack = [canteen.name, canteen.location, canteen.status, canteen.queue]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [canteens, searchTerm]);

  const openCount = canteens.filter((canteen) => String(canteen.status || '').toLowerCase() === 'open').length;
  const closedCount = canteens.length - openCount;

  const getArtwork = (name = '') => {
    const artworkMap = {
      basement: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1200&auto=format&fit=crop',
      new: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop',
      anohana: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop',
    };

    const key = name.toLowerCase();
    if (key.includes('basement')) return artworkMap.basement;
    if (key.includes('new')) return artworkMap.new;
    if (key.includes('anohana')) return artworkMap.anohana;
    return 'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=1200&auto=format&fit=crop';
  };

  if (loading) {
    return <div className="canteen-directory-loader">Loading Canteens...</div>;
  }

  return (
    <div className="app-container">
      <Navbar />
      <div className="canteen-directory-page">
        <section className="canteen-directory-hero">
          <div className="canteen-directory-hero-copy">
            <p className="canteen-directory-kicker">Campus Dining</p>
            <h1>Discover every canteen in one beautiful view</h1>
            <p>
              Explore menus, live queue indicators, opening hours, and canteen locations with a fuller, faster browsing experience.
            </p>

            <div className="canteen-directory-searchbar">
              <input
                type="text"
                className="canteen-directory-search-input"
                placeholder="Search by canteen, location, queue, or status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="canteen-directory-stats">
              <article>
                <strong>{canteens.length}</strong>
                <span>Total Canteens</span>
              </article>
              <article>
                <strong>{openCount}</strong>
                <span>Open Now</span>
              </article>
              <article>
                <strong>{closedCount}</strong>
                <span>Closed</span>
              </article>
            </div>
          </div>

          <div className="canteen-directory-hero-visual">
            <div className="canteen-directory-feature-card">
              <img
                src="https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?q=80&w=1400&auto=format&fit=crop"
                alt="Campus food service"
              />
              <div className="canteen-directory-feature-overlay">
                <span>Live dining</span>
                <h3>Fresh, fast, and campus-ready</h3>
              </div>
            </div>
          </div>
        </section>

        <div className="canteen-directory-toolbar">
          <p>
            Showing <strong>{filteredCanteens.length}</strong> of <strong>{canteens.length}</strong> canteens
          </p>
        </div>

        <div className="canteen-grid">
          {filteredCanteens.map((canteen, index) => {
            const isOpen = String(canteen.status || '').toLowerCase() === 'open';
            const queue = String(canteen.queue || 'Low');

            return (
              <button
                key={canteen._id}
                type="button"
                className="canteen-card canteen-card-pressable"
                style={{ animationDelay: `${index * 0.08}s` }}
                onClick={() => navigate(`/canteen/${canteen._id}`)}
              >
                <div className="canteen-card-image" style={{ backgroundImage: `url(${getArtwork(canteen.name)})` }}>
                  <div className={`status-badge ${isOpen ? 'open' : 'closed'}`}>
                    {isOpen ? 'Open' : 'Closed'}
                  </div>
                  <div className="canteen-card-image-gradient" />
                </div>

                <div className="canteen-card-content">
                  <h2>{canteen.name}</h2>
                  <p className="canteen-card-location">{canteen.location}</p>

                  <div className="canteen-info">
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

                  <div className="canteen-card-footer">
                    <span className="view-details-chip">View details</span>
                    <span className="canteen-card-arrow">→</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CanteenDirectory;
