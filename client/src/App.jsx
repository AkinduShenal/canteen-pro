import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import MenuBrowse from './pages/menu/MenuBrowse.jsx';
import StaffMenuManagement from './pages/staff/StaffMenuManagement.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/menu" element={<MenuBrowse />} />
          <Route path="/staff/menu-management" element={<StaffMenuManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
