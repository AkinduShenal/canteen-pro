import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import MenuBrowse from './pages/menu/MenuBrowse.jsx';
import StaffMenuManagement from './pages/staff/StaffMenuManagement.jsx';
import StaffCategoryManagement from './pages/staff/StaffCategoryManagement.jsx';
import Unauthorized from './pages/auth/Unauthorized.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route path="/menu" element={<MenuBrowse />} />
          <Route
            path="/staff/category-management"
            element={(
              <RoleRoute allowedRoles={['staff', 'admin']}>
                <StaffCategoryManagement />
              </RoleRoute>
            )}
          />
          <Route
            path="/staff/menu-management"
            element={(
              <RoleRoute allowedRoles={['staff', 'admin']}>
                <StaffMenuManagement />
              </RoleRoute>
            )}
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
