import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import CreatorPage from './pages/CreatorPage';
import UserPage from './pages/UserPage';
import MySubscriptions from './pages/MySubscriptions';
import AdminPanel from './pages/AdminPanel';
import NavBar from './components/NavBar';

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [userRole, setUserRole] = useState('');

  return (
    <Router>
      <NavBar userAddress={userAddress} userRole={userRole} />
      <Routes>
        <Route path="/creator" element={<CreatorPage />} />
        <Route path="/login" element={<LoginPage setUserAddress={setUserAddress} setUserRole={setUserRole} />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/mysubs" element={<MySubscriptions />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

export default App;
