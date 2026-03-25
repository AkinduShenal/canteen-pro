import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * RoleProtectedRoute Component
 * Restricts access to routes based on user authentication and roles.
 * 
 * @param {Object} props
 * @param {Array<string>} props.allowedRoles - List of roles permitted to access the route
 * @param {React.ReactNode} props.children - Component(s) to render if authorized
 */
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Handle loading state if your AuthContext provides it
  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Verifying authorization...</p>
      </div>
    );
  }

  if (!user) {
    // If not logged in, redirect to login page, but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If role is not authorized, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and authorized, render children
  return children;
};

export default RoleProtectedRoute;
