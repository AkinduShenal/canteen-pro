import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar.jsx';

const Unauthorized = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="staff-menu-wrap">
        <section className="staff-gate-card">
          <h2>Unauthorized access</h2>
          <p>You do not have permission to open this page.</p>
          <Link className="btn btn-outline" to="/">Back to Home</Link>
        </section>
      </main>
    </div>
  );
};

export default Unauthorized;
