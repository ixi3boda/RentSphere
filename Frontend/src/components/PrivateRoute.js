// src/components/PrivateRoute.js
//
// Protects routes that require authentication.
// Redirects unauthenticated users to /login while preserving the target URL.
// Usage: <PrivateRoute><MyPage /></PrivateRoute>

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return null;
  }

  if (!isAuthenticated) {
    // Pass the original destination so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
