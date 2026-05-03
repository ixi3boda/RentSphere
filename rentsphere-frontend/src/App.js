// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PropertyProvider } from './context/PropertyContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import PropertyForm from './pages/owner/PropertyForm';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PropertyProvider>
          <Navbar />
          <Routes>
            {/* Existing routes — unchanged */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />

            {/* RS-8: Property CRUD (owner only) */}
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/properties/new" element={<PropertyForm />} />
            <Route path="/owner/properties/edit/:id" element={<PropertyForm />} />

            {/* RS-10: Property Listing & Detail (tenant) */}
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
          </Routes>
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;