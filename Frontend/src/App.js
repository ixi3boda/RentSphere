// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PropertyProvider } from "./context/PropertyContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import PropertyForm from "./pages/owner/PropertyForm";
import PropertyList from "./pages/PropertyList";
import PropertyDetail from "./pages/PropertyDetail";

function App() {
  return (
    <Router>
      <AuthProvider>
        <PropertyProvider>
          <Navbar />
          <Routes>
            {/* Public routes — no token needed */}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Public property browsing — backend allows unauthenticated GET */}
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />

            {/* Protected favorites page */}
            <Route path="/favorites" element={
              <PrivateRoute><Favorites /></PrivateRoute>
            } />

            {/* Protected — must be logged in */}
            <Route path="/profile" element={
              <PrivateRoute><Profile /></PrivateRoute>
            } />

            {/* Protected owner routes — must be logged in */}
            <Route path="/owner/dashboard" element={
              <PrivateRoute><OwnerDashboard /></PrivateRoute>
            } />
            <Route path="/tenant/dashboard" element={
              <PrivateRoute><TenantDashboard /></PrivateRoute>
            } />
            <Route path="/owner/properties/new" element={
              <PrivateRoute><PropertyForm /></PrivateRoute>
            } />
            <Route path="/owner/properties/edit/:id" element={
              <PrivateRoute><PropertyForm /></PrivateRoute>
            } />
          </Routes>
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

// Small helper component so root path redirects to /login when not authenticated
function HomeRedirect() {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return null; // wait for auth restoration
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Home />;
}
