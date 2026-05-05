// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { authApi } from "../utils/api";
import { mapUserToFrontend } from "../utils/mappers";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Restore session from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Login — POST /api/user/login  →  { token }  →  GET /api/user/me
  // -------------------------------------------------------------------------
  const login = async (email, password) => {
    setLoading(true);
    try {
      // 1. Get JWT
      const loginRes = await authApi.login({ email, password_hash: password });
      const token = loginRes.data?.token;
      if (!token) throw new Error("No token received from server.");
      localStorage.setItem("token", token);

      // 2. Fetch full user profile
      const meRes = await authApi.getMe();
      const mapped = mapUserToFrontend(meRes.data);
      setUser(mapped);
      localStorage.setItem("user", JSON.stringify(mapped));

      return { success: true };
    } catch (error) {
      localStorage.removeItem("token");
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Signup — POST /api/user/register  →  get token  →  GET /api/user/me
  // Does NOT call login() again to avoid a duplicate-email error on the
  // second React StrictMode render and to save an extra round-trip.
  // -------------------------------------------------------------------------
  const signup = async (name, email, password, role) => {
    setLoading(true);
    try {
      // Map UI role to backend role_name.
      // Backend accepts 'TENANT' or 'VISITOR'. 'ADMIN' cannot be self-assigned.
      const backendRole = role === 'owner' ? 'TENANT' : 'TENANT';

      const registerRes = await authApi.register({
        email,
        password_hash:  password,
        username:       name,
        full_name:      name,
        mobile_number:  '',
        avatar_url:     '',
        role_name:      backendRole,
      });

      const token = registerRes.data?.token;
      if (!token) throw new Error('No token received after registration.');
      localStorage.setItem('token', token);

      // Fetch the full user profile — role comes from the backend (source of truth)
      const meRes  = await authApi.getMe();
      const mapped = mapUserToFrontend(meRes.data);
      setUser(mapped);
      localStorage.setItem('user', JSON.stringify(mapped));

      return { success: true };
    } catch (error) {
      localStorage.removeItem('token');
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // -------------------------------------------------------------------------
  // Update user (local state + localStorage only — no backend endpoint yet)
  // -------------------------------------------------------------------------
  const updateUser = async (userData) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
