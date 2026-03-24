import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import CanteenDirectory from './pages/CanteenDirectory.jsx';
import CanteenDetails from './pages/CanteenDetails.jsx';
import StaffCanteenManagement from './pages/StaffCanteenManagement.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/canteens" element={<CanteenDirectory />} />
          <Route path="/canteen/:id" element={<CanteenDetails />} />
          <Route path="/staff/canteens" element={<StaffCanteenManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
