import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const isStaffOrAdmin = user?.role === 'staff' || user?.role === 'admin';

  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        {!user ? (
          <div className="home-page">
            <section className="home-hero">
              <div className="home-hero-overlay" />
              <div className="home-hero-content">
                <p className="home-kicker">Smart Campus Canteen Experience</p>
                <h1>Delicious Meals, Just a Click Away</h1>
                <p>
                  Discover canteen menus in seconds, grab daily specials, and skip long queues with fast
                  pre-ordering built for student life.
                </p>
                <div className="home-hero-actions">
                  <Link to="/register" className="btn btn-primary">Create Account</Link>
                  <Link to="/menu" className="btn btn-outline">Browse Menu</Link>
                </div>
              </div>
              <div className="home-hero-stats">
                <article className="home-stat-card">
                  <h3>3+</h3>
                  <p>Campus canteens ready</p>
                </article>
                <article className="home-stat-card">
                  <h3>24+</h3>
                  <p>Daily menu choices</p>
                </article>
                <article className="home-stat-card">
                  <h3>Fast</h3>
                  <p>Pickup without queues</p>
                </article>
              </div>
            </section>

            <section className="home-features-extended">
              <div className="home-section-head" style={{ marginBottom: '2rem' }}>
                <h2>Powerful Features Built for Campus</h2>
                <p>Everything designed with students and staff in mind</p>
              </div>
              <div className="home-features-extended-grid">
                <article className="home-feature-extended">
                  <div className="home-feature-extended-icon">🍽️</div>
                  <h3>Live Menu Updates</h3>
                  <p>Staff instantly update what's available and coming up.</p>
                </article>
                <article className="home-feature-extended">
                  <div className="home-feature-extended-icon">📊</div>
                  <h3>Category Filtering</h3>
                  <p>Find what you want by meal type, cuisine, or dietary preference.</p>
                </article>
                <article className="home-feature-extended">
                  <div className="home-feature-extended-icon">⭐</div>
                  <h3>Daily Specials</h3>
                  <p>Discover limited-time offers and chef's specials first.</p>
                </article>
                <article className="home-feature-extended">
                  <div className="home-feature-extended-icon">🔔</div>
                  <h3>Smart Availability</h3>
                  <p>Know instantly what's in stock before you order.</p>
                </article>
              </div>
            </section>

            <section className="home-how-it-works">
              <div className="home-section-head">
                <h2>How It Works</h2>
              </div>
              <div className="home-steps-grid">
                <article className="home-step-card">
                  <span>01</span>
                  <h3>Choose Your Canteen</h3>
                  <p>Start from the menu page and select where you want to order from.</p>
                </article>
                <article className="home-step-card">
                  <span>02</span>
                  <h3>Pick Your Meal</h3>
                  <p>Open any item card to view details, then add it to cart or order instantly.</p>
                </article>
                <article className="home-step-card">
                  <span>03</span>
                  <h3>Confirm and Collect</h3>
                  <p>Complete your order and collect your meal at the canteen with less waiting.</p>
                </article>
              </div>
            </section>

            <section className="home-benefits-showcase">
              <div className="home-section-head" style={{ marginBottom: '1.8rem' }}>
                <h2>Why Students Love CanteenPro</h2>
              </div>
              <div className="home-benefits-grid">
                <article className="home-benefit-item">
                  <div className="home-benefit-icon">⚡</div>
                  <h3>Fast Ordering</h3>
                  <p>Place your order in seconds and skip waiting in long queues.</p>
                </article>
                <article className="home-benefit-item">
                  <div className="home-benefit-icon">📱</div>
                  <h3>Easy Access</h3>
                  <p>Browse menus from anywhere on campus anytime you want.</p>
                </article>
                <article className="home-benefit-item">
                  <div className="home-benefit-icon">💰</div>
                  <h3>Smart Pricing</h3>
                  <p>Transparent prices and no hidden charges ever.</p>
                </article>
              </div>
            </section>

            <section className="home-problem-statement">
              <div className="home-problem-content">
                <h2>The Campus Canteen Challenge</h2>
                <p>
                  Students today face long queues during lunch breaks, cash-only transactions, and no way to know 
                  what's available before walking over. Canteen staff manually manage everything without proper 
                  systems. CanteenPro solves this with automated ordering, real-time menu updates, and instant 
                  availability tracking—making campus food convenient for everyone.
                </p>
              </div>
              <div className="home-problem-visual">
                <div className="home-problem-icon">🎯</div>
              </div>
            </section>

            <section className="home-highlight-banner">
              <div className="home-highlight-icon">⏱️</div>
              <h2>No More Long Queues</h2>
              <p>Pre-order your meal and pick it up faster. No waiting, more time for friends.</p>
            </section>

            <section className="home-cta-banner">
              <div>
                <h2>Start Ordering Today</h2>
                <p>Sign in to start ordering and enjoy faster campus food pickup.</p>
              </div>
              <div className="home-cta-actions">
                <Link to="/login" className="btn btn-outline">Sign In</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </div>
            </section>

            <footer className="home-footer">
              <div className="home-footer-content">
                <div className="home-footer-brand">
                  <h3>CanteenPro</h3>
                  <p>Smart campus canteen ordering for a better student experience.</p>
                </div>
                <div className="home-footer-links">
                  <div>
                    <h4>About</h4>
                    <ul>
                      <li><Link to="/menu">Browse Menu</Link></li>
                      <li><a href="#features">Features</a></li>
                      <li><a href="#how">How It Works</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4>Support</h4>
                    <ul>
                      <li><Link to="/login">Sign In</Link></li>
                      <li><Link to="/register">Register</Link></li>
                      <li><a href="#contact">Contact Us</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="home-footer-bottom">
                <p>&copy; 2026 CanteenPro. All rights reserved.</p>
                <p>Built for campus, by students.</p>
              </div>
            </footer>
          </div>
        ) : (
          <div className="home-dashboard-wrap">
            <div className="home-dashboard-head">
              <h2 className="text-gradient">Welcome Back, {user.name}</h2>
              <p>Your canteen dashboard is ready. Pick an action to continue.</p>
            </div>

            <div className="welcome-card">
              <div className="avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ marginBottom: '1rem', fontSize: '2rem' }}>Great to see you again</h3>
              <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginBottom: '2.5rem', fontSize: '1.2rem' }}>
                Logged in as <span className="user-badge">{user.role}</span>
              </p>
              <div className="home-dashboard-actions">
                <Link to="/menu" className="btn btn-primary">Open Menu</Link>
                <Link to="/profile" className="btn btn-outline">View Profile</Link>
                {isStaffOrAdmin ? (
                  <>
                    <Link to="/staff/category-management" className="btn btn-outline">Manage Categories</Link>
                    <Link to="/staff/menu-management" className="btn btn-outline">Manage Items</Link>
                  </>
                ) : null}
              </div>
              <button className="btn btn-primary home-signout-btn" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
