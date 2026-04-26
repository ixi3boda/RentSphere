// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load user from localStorage on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    setLoading(true);
    try {
      // TODO: Connect to Spring Boot
      console.log('Logging in:', email);
      
      // Simulate API response for now
      const mockUser = { id: 1, email, role: 'tenant', name: email.split('@')[0] };
      setUser(mockUser);
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
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
      localStorage.setItem('user', JSON.stringify(mockUser));
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
    localStorage.removeItem('user');
  };

  // UPDATE USER FUNCTION - Add this new function
 // Update user function - add this to AuthContext.js
const updateUser = async (userData) => {
  setLoading(true);
  try {
    // TODO: Replace with actual Spring Boot API call
    // For image upload in production, use FormData:
    // const formData = new FormData();
    // formData.append('name', userData.name);
    // formData.append('phone', userData.phone);
    // formData.append('location', userData.location);
    // formData.append('bio', userData.bio);
    // if (userData.profilePicture && userData.profilePicture.startsWith('data:image')) {
    //   formData.append('profilePicture', userData.profilePicture);
    // }
    // const response = await axios.put('/api/users/profile', formData, {
    //   headers: { 
    //     Authorization: `Bearer ${localStorage.getItem('token')}`,
    //     'Content-Type': 'multipart/form-data'
    //   }
    // });
    
    // For now, simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Update local user state
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
    
    // Store updated user in localStorage
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return { success: true };
  } catch (error) {
    console.error('Update failed:', error);
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
    updateUser,  // ← Make sure this is included
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}