// src/context/AuthContext.js

//(Manages login/signup state globally)
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Login function - will connect to Spring Boot later
  const login = async (email, password) => {
    setLoading(true);
    try {
      // TODO: Connect to Spring Boot
      console.log('Logging in:', email);
      
      // Simulate API response for now
      const mockUser = { id: 1, email, role: 'tenant' };
      setUser(mockUser);
      localStorage.setItem('token', 'mock-jwt-token');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (name, email, password, role) => {
    setLoading(true);
    try {
      console.log('Signing up:', { name, email, role });
      
      const mockUser = { id: 1, name, email, role };
      setUser(mockUser);
      localStorage.setItem('token', 'mock-jwt-token');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}