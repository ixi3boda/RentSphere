
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
            {}
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {}
            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />

            {}
            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <Favorites />
                </PrivateRoute>
              }
            />

            {}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            {}
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

            {}
            <Route path="/paypal/callback" element={<PayPalCallbackPage />} />
          </Routes>
        </PropertyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;


function HomeRedirect() {
  const { initializing } = useAuth();
  if (initializing) return null; 
  return <Home />;
}
