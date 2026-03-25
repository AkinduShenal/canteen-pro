import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const Unauthorized = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
        <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>🚫</div>
        <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>Access Denied</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', maxWidth: '500px', marginBottom: '3rem' }}>
          Oops! It looks like you don't have the necessary permissions to view this page. 
          Please contact your administrator if you believe this is an error.
        </p>
        <Link to="/" className="btn btn-primary" style={{ width: 'auto', padding: '1.2rem 3rem' }}>
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
