import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import StaffAdminDashboard from './pages/StaffAdminDashboard.jsx';
import CanteenDirectory from './pages/CanteenDirectory.jsx';
import CanteenDetails from './pages/CanteenDetails.jsx';
import StaffCanteenManagement from './pages/StaffCanteenManagement.jsx';
import MenuBrowse from './pages/menu/MenuBrowse.jsx';
import StaffMenuManagement from './pages/staff/StaffMenuManagement.jsx';
import StaffCategoryManagement from './pages/staff/StaffCategoryManagement.jsx';

import Unauthorized from './pages/auth/Unauthorized.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleProtectedRoute from './components/RoleProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/dashboard/*"
            element={
              <RoleRoute allowedRoles={['admin']}>
                <StaffAdminDashboard />
              </RoleRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected User Route */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Public Canteen Routes */}
          <Route path="/canteens" element={<CanteenDirectory />} />
          <Route path="/canteen/:id" element={<CanteenDetails />} />
          <Route path="/menu" element={<MenuBrowse />} />

          {/* Staff/Admin Protected Routes */}
          <Route
            path="/staff/canteens"
            element={
              <RoleProtectedRoute allowedRoles={['staff', 'admin']}>
                <StaffCanteenManagement />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/staff/category-management"
            element={
              <RoleRoute allowedRoles={['staff', 'admin']}>
                <StaffCategoryManagement />
              </RoleRoute>
            }
          />

          <Route
            path="/staff/menu-management"
            element={
              <RoleRoute allowedRoles={['staff', 'admin']}>
                <StaffMenuManagement />
              </RoleRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;