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
  const [initializing, setInitializing] = useState(true);

  const hasToken =
    !!sessionStorage.getItem("token") ||
    !!localStorage.getItem("token") ||
    document.cookie.includes("rentsphere_token=");

  // Restore session on app start
  // Priority: sessionStorage (current session) → localStorage (stay signed in) → cookie (fallback)
  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    // 1. Check sessionStorage first (current session without "stay signed in")
    const sessionUser = sessionStorage.getItem("user");
    const sessionToken = sessionStorage.getItem("token");
    if (sessionUser && sessionToken) {
      setUser(JSON.parse(sessionUser));
      setInitializing(false);
      return;
    }

    // 2. Check localStorage (stay signed in)
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setInitializing(false);
      return;
    }

    // 3. Check cookie fallback (stay-signed-in from previous session)
    const cookieToken = getCookie('rentsphere_token');
    if (cookieToken) {
      // populate localStorage so apiClient interceptor picks it up
      localStorage.setItem('token', cookieToken);
      // fetch profile
      (async () => {
        try {
          const meRes = await authApi.getMe();
          const mapped = mapUserToFrontend(meRes.data);
          setUser(mapped);
          localStorage.setItem('user', JSON.stringify(mapped));
        } catch (e) {
          // invalid token, clean up
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          document.cookie = 'rentsphere_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        } finally {
          setInitializing(false);
        }
      })();
    } else {
      setInitializing(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Login — POST /api/user/login  →  { token }  →  GET /api/user/me
  // If staySignedIn = false: use sessionStorage (persists on refresh, clears on tab close)
  // If staySignedIn = true: use localStorage + long-lived cookie (persists across browser close)
  // -------------------------------------------------------------------------
  const login = async (email, password, staySignedIn = false) => {
    setLoading(true);
    try {
      // 1. Get JWT
      const loginRes = await authApi.login({ email, password_hash: password });
      const token = loginRes.data?.token;
      if (!token) throw new Error("No token received from server.");

      if (staySignedIn) {
        // Persist across browser close: use localStorage + cookie
        localStorage.setItem("token", token);
        const maxAge = 60 * 60 * 24 * 30; // 30 days
        document.cookie = `rentsphere_token=${encodeURIComponent(token)}; Path=/; max-age=${maxAge};`;
        // Clear sessionStorage if it had anything
        sessionStorage.removeItem("token");
      } else {
        // Session-only: use sessionStorage (clears on browser close)
        sessionStorage.setItem("token", token);
        // Clear localStorage if it had anything
        localStorage.removeItem("token");
        // Clear the "stay signed in" cookie
        document.cookie = 'rentsphere_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }

      // 2. Fetch full user profile
      const meRes = await authApi.getMe();
      const mapped = mapUserToFrontend(meRes.data);
      setUser(mapped);

      // Store user in the same storage as the token
      if (staySignedIn) {
        localStorage.setItem("user", JSON.stringify(mapped));
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("user", JSON.stringify(mapped));
        localStorage.removeItem("user");
      }

      return { success: true };
    } catch (error) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
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
  // Uses sessionStorage (current session only)
  // Does NOT call login() again to avoid a duplicate-email error on the
  // second React StrictMode render and to save an extra round-trip.
  // -------------------------------------------------------------------------
  const signup = async (name, email, password, role) => {
    setLoading(true);
    try {
      // Map UI role to backend role_name.
      // Backend accepts 'TENANT' or 'VISITOR'. 'OWNER' cannot be self-assigned.
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
      
      // Use sessionStorage for signup (current session only)
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');

      // Fetch the full user profile — role comes from the backend (source of truth)
      const meRes  = await authApi.getMe();
      const mapped = mapUserToFrontend(meRes.data);
      setUser(mapped);
      sessionStorage.setItem('user', JSON.stringify(mapped));
      localStorage.removeItem('user');

      return { success: true };
    } catch (error) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
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
    // Clear both storage types
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    // Clear "stay signed in" cookie
    document.cookie = 'rentsphere_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
    isAuthenticated: !!user && hasToken,
    initializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
