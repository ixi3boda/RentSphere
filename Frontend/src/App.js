// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PropertyProvider } from "./context/PropertyContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RentalRequestsPage from "./pages/admin/RentalRequestsPage";
import ContractsPage from "./pages/admin/ContractsPage";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import PropertyForm from "./pages/owner/PropertyForm";
import PropertyList from "./pages/PropertyList";
import PropertyDetail from "./pages/PropertyDetail";
import PayPalCallbackPage from "./pages/PayPalCallbackPage";

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
            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <Favorites />
                </PrivateRoute>
              }
            />

            {/* Protected — must be logged in */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {/* Protected admin routes — must be logged in */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <PrivateRoute>
                  <RentalRequestsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/contracts"
              element={
                <PrivateRoute>
                  <ContractsPage />
                </PrivateRoute>
              }
            />
            <Route path="/tenant/dashboard" element={<TenantDashboard />} />
            <Route
              path="/admin/properties/new"
              element={
                <PrivateRoute>
                  <PropertyForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/properties/edit/:id"
              element={
                <PrivateRoute>
                  <PropertyForm />
                </PrivateRoute>
              }
            />

            {/* PayPal callback — public but only meaningful after a payment flow */}
            <Route path="/paypal/callback" element={<PayPalCallbackPage />} />
          </Routes>
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

// Small helper component so root path redirects to /login when not authenticated
function HomeRedirect() {
  const { initializing } = useAuth();
  if (initializing) return null; // wait for auth restoration
  return <Home />;
}
