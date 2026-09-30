
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PropertyProvider } from "./context/PropertyContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
    // "user" lets prefers-reduced-motion skip the entrance transforms instead of trapping
    // vestibular-sensitive users in them.
    <MotionConfig reducedMotion="user">
    <Router>
      <AuthProvider>
        <PropertyProvider>
          {/* Navbar is fixed, so keyboard users need a way past it. */}
          <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-white focus:text-slate-900 focus:font-bold focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg">
            Skip to content
          </a>
          <Navbar />
          <main id="main-content">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/properties" element={<PropertyList />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />

            <Route
              path="/favorites"
              element={
                <PrivateRoute>
                  <Favorites />
                </PrivateRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
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
            <Route
              path="/tenant/dashboard"
              element={
                <PrivateRoute allowedRoles={["tenant"]}>
                  <TenantDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/properties/new"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <PropertyForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/properties/edit/:id"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <PropertyForm />
                </PrivateRoute>
              }
            />

            <Route path="/paypal/callback" element={<PayPalCallbackPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </main>
          <Footer />
        </PropertyProvider>
      </AuthProvider>
    </Router>
    </MotionConfig>
  );
}

export default App;


function HomeRedirect() {
  const { initializing } = useAuth();
  if (initializing) return null;
  return <Home />;
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl font-black text-slate-900 mb-3">404</p>
      <p className="text-slate-600 font-medium mb-8">That page does not exist.</p>
      <Link to="/properties" className="btn-primary">Browse listings</Link>
    </div>
  );
}
