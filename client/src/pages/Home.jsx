import React, { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const featuredMeals = [
    {
      name: 'Rice Bowl',
      tag: 'Popular',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Chicken Kottu',
      tag: 'Campus Favorite',
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc500f?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Wrap Combo',
      tag: 'Quick Bite',
      image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Pasta Plate',
      tag: 'Chef Pick',
      image: 'https://images.unsplash.com/photo-1527761939622-9119094632ac?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Burger Stack',
      tag: 'Best Seller',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Fresh Salad',
      tag: 'Light Choice',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  const reelMeals = [...featuredMeals, ...featuredMeals];
  const dashboardReel = [...featuredMeals.slice(0, 4), ...featuredMeals.slice(2, 6), ...featuredMeals.slice(0, 4)];

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        {!user ? (
          <div className="home-page home-page-cinematic">
            <section className="home-cinematic-hero">
              <div className="home-cinematic-copy">
                <p className="home-cinematic-kicker">Campus dining, reimagined</p>
                <h1>Eat fast. Order smart. Keep the queue moving.</h1>
                <p>
                  Explore campus canteens, discover daily specials, and order from a polished experience built around our orange-and-cream brand.
                </p>

                <div className="home-cinematic-actions">
                  <Link to="/register" className="btn btn-primary">Create Account</Link>
                  <Link to="/menu" className="btn btn-outline">Browse Menu</Link>
                </div>

                <div className="home-cinematic-badges">
                  <article>
                    <span>Live menus</span>
                    <strong>Updated by staff</strong>
                  </article>
                  <article>
                    <span>Pickup flow</span>
                    <strong>Fast and simple</strong>
                  </article>
                  <article>
                    <span>Daily specials</span>
                    <strong>Always visible</strong>
                  </article>
                </div>
              </div>

              <div className="home-cinematic-visual">
                <div className="home-cinematic-main-image">
                  <img
                    src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1400&auto=format&fit=crop"
                    alt="Campus meal spread"
                  />
                </div>

                <div className="home-cinematic-mini-grid">
                  <article>
                    <img
                      src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop"
                      alt="Fresh plated dish"
                    />
                    <span>Fresh plates</span>
                  </article>
                  <article>
                    <img
                      src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop"
                      alt="Packed canteen meal"
                    />
                    <span>Daily packs</span>
                  </article>
                </div>
              </div>
            </section>

            <section className="home-reel-section">
              <div className="home-section-head home-section-head--dark">
                <h2>Featured Menu Reel</h2>
                <p>A moving strip of campus favorites, styled with our warm brand colors.</p>
              </div>

              <div className="home-menu-reel" aria-label="Featured menu items scrolling reel">
                <div className="home-menu-reel-track">
                  {reelMeals.map((item, index) => (
                    <article key={`${item.name}-${index}`} className="home-menu-reel-card">
                      <img src={item.image} alt={item.name} loading="lazy" />
                      <div className="home-menu-reel-overlay">
                        <span>{item.tag}</span>
                        <h3>{item.name}</h3>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="home-reel-footer">
                <Link to="/menu" className="btn btn-outline">View Menu</Link>
                <p>Fast updates, clean visuals, and a premium layout that still feels campus-friendly.</p>
              </div>
            </section>

            <section className="home-cinematic-metrics">
              <article>
                <span>Campus canteens</span>
                <strong>3+</strong>
              </article>
              <article>
                <span>Menu items</span>
                <strong>24+</strong>
              </article>
              <article>
                <span>Pickup speed</span>
                <strong>Fast</strong>
              </article>
            </section>
          </div>
        ) : (
          <div className="home-dashboard-wrap">
            <div className="home-dashboard-surface">
              <section className="home-dashboard-cinematic">
                <div className="home-dashboard-head home-dashboard-head-elevated home-dashboard-head-dark">
                  <div>
                    <p className="home-dashboard-kicker">Staff Console</p>
                    <h2 className="text-gradient">Welcome Back, {user.name}</h2>
                    <p>Your canteen workspace is ready. Pick an action to continue.</p>
                  </div>
                  <div className="home-role-pill-wrap">
                    <span className="user-badge">{user.role}</span>
                    <small>Live session</small>
                  </div>
                </div>

                <div className="home-dashboard-cinematic-grid">
                  <section className="home-dashboard-cinematic-panel">
                    <p className="home-dashboard-kicker">Daily Operations</p>
                    <h3>Run the canteen from one polished workspace</h3>
                    <p>
                      Manage items, keep categories tidy, and move fast with a visual layout designed for staff.
                    </p>

                    <div className="home-dashboard-stats-grid home-dashboard-stats-grid-dark">
                      <article className="home-dashboard-stat-tile home-dashboard-stat-tile-dark">
                        <span>Workspace</span>
                        <strong>Staff Tools</strong>
                      </article>
                      <article className="home-dashboard-stat-tile home-dashboard-stat-tile-dark">
                        <span>Access</span>
                        <strong>Menu + Categories</strong>
                      </article>
                      <article className="home-dashboard-stat-tile home-dashboard-stat-tile-dark">
                        <span>Status</span>
                        <strong>Ready</strong>
                      </article>
                    </div>

                    <div className="home-dashboard-actions home-dashboard-actions--hero">
                      <Link to="/menu" className="btn btn-primary">Open Menu</Link>
                      <Link to="/profile" className="btn btn-outline">View Profile</Link>
                      {isStaffOrAdmin ? (
                        <>
                          <Link to="/staff/category-management" className="btn btn-outline">Manage Categories</Link>
                          <Link to="/staff/menu-management" className="btn btn-outline">Manage Items</Link>
                        </>
                      ) : null}
                    </div>
                  </section>

                  <aside className="home-dashboard-cinematic-visual">
                    <div className="home-dashboard-cinematic-corner">
                      <div className="avatar-circle">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="welcome-title">Great to see you again</h3>
                        <p className="welcome-subtitle">Logged in as <span className="user-badge">{user.role}</span></p>
                      </div>
                    </div>

                    <div className="home-dashboard-cinematic-cards">
                      <Link to="/menu" className="home-visual-card home-visual-card-main" aria-label="Explore today's menu">
                        <img
                          src="https://images.unsplash.com/photo-1543353071-087092ec393a?q=80&w=1200&auto=format&fit=crop"
                          alt="Plated canteen meal"
                          loading="lazy"
                        />
                        <div className="home-visual-overlay">
                          <span>Today's Picks</span>
                          <h4>Fresh meals ready now</h4>
                        </div>
                      </Link>

                      <div className="home-visual-card home-visual-card-stack">
                        <img
                          src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=1200&auto=format&fit=crop"
                          alt="Campus cafeteria"
                          loading="lazy"
                        />
                        <div className="home-visual-overlay">
                          <span>Campus Canteens</span>
                          <h4>Check open locations</h4>
                        </div>
                      </div>
                    </div>

                    <div className="home-dashboard-note home-dashboard-note-dark">
                      <p>Fast access to your daily workflow, with visual cues and one-tap navigation.</p>
                    </div>
                  </aside>
                </div>

                <section className="home-dashboard-reel-section">
                  <div className="home-section-head home-section-head--dark home-section-head--compact">
                    <h2>Menu Item Reel</h2>
                    <p>Live movement inspired by your reference, tuned to our colors.</p>
                  </div>

                  <div className="home-menu-reel home-menu-reel--dark" aria-label="Staff dashboard featured menu reel">
                    <div className="home-menu-reel-track">
                      {dashboardReel.map((item, index) => (
                        <article key={`${item.name}-${index}`} className="home-menu-reel-card home-menu-reel-card--dark">
                          <img src={item.image} alt={item.name} loading="lazy" />
                          <div className="home-menu-reel-overlay">
                            <span>{item.tag}</span>
                            <h3>{item.name}</h3>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="home-dashboard-footer-actions">
                  <button className="btn btn-primary home-signout-btn" onClick={logout}>
                    Sign Out
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
