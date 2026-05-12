
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { authApi } from "../utils/api";
import { mapUserToFrontend } from "../utils/mappers";

export const AuthContext = createContext();
export default AuthContext;

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const persistUser = useCallback((mapped) => {
    if (!mapped) return;
    if (localStorage.getItem("user")) {
      localStorage.setItem("user", JSON.stringify(mapped));
    }
    if (sessionStorage.getItem("user")) {
      sessionStorage.setItem("user", JSON.stringify(mapped));
    }
  }, []);

  
  
  
  const refreshUser = useCallback(async () => {
    try {
      const meRes = await authApi.getMe();
      const mapped = mapUserToFrontend(meRes.data);
      setUser(mapped);
      persistUser(mapped);
      return { success: true, data: mapped };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }, [persistUser]);

  
  
  useEffect(() => {
    const getCookie = (name) => {
      const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    };

    
    const sessionUser = sessionStorage.getItem("user");
    const sessionToken = sessionStorage.getItem("token");
    if (sessionUser && sessionToken) {
      setUser(JSON.parse(sessionUser));
      refreshUser();
      setInitializing(false);
      return;
    }

    
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      refreshUser();
      setInitializing(false);
      return;
    }

    
    const cookieToken = getCookie('rentsphere_token');
    if (cookieToken) {
      
      localStorage.setItem('token', cookieToken);
      
      (async () => {
        try {
          const refreshed = await refreshUser();
          if (refreshed.success && refreshed.data) {
            localStorage.setItem('user', JSON.stringify(refreshed.data));
          }
        } catch (e) {
          
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
  }, [refreshUser]);

  
  
  
  
  
  const login = async (email, password, staySignedIn = false) => {
    setLoading(true);
    try {
      
      const loginRes = await authApi.login({ email, password_hash: password });
      const token = loginRes.data?.token;
      if (!token) throw new Error("No token received from server.");

      if (staySignedIn) {
        
        localStorage.setItem("token", token);
        const maxAge = 60 * 60 * 24 * 30; 
        document.cookie = `rentsphere_token=${encodeURIComponent(token)}; Path=/; max-age=${maxAge};`;
        
        sessionStorage.removeItem("token");
      } else {
        
        sessionStorage.setItem("token", token);
        
        localStorage.removeItem("token");
        
        document.cookie = 'rentsphere_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }

      
      const meRes = await authApi.getMe();
      const mapped = mapUserToFrontend(meRes.data);
      setUser(mapped);

      
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

  
  
  
  
  
  
  const signup = async (name, email, password, phone = '', avatarUrl = '') => {
    setLoading(true);
    try {
      const registerRes = await authApi.register({
        email,
        password_hash:  password,
        username:       name,
        full_name:      name,
        mobile_number:  phone,
        avatar_url:     avatarUrl,
      });

      const token = registerRes.data?.token;
      if (!token) throw new Error('No token received after registration.');
      
      
      sessionStorage.setItem('token', token);
      localStorage.removeItem('token');

      
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

  
  
  
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (_error) {
      
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      document.cookie = 'rentsphere_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  };

  
  
  
  const updateProfile = async (payload) => {
    setLoading(true);
    try {
      const res = await authApi.updateProfile(payload);
      const data = res.data;
      const mapped = mapUserToFrontend(data.user || data);

      const storingInLocalStorage = !!localStorage.getItem("token");
      const storingInSessionStorage = !!sessionStorage.getItem("token");
      const token = data.token || sessionStorage.getItem("token") || localStorage.getItem("token");

      setUser(mapped);

      if (storingInLocalStorage) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(mapped));
      }
      if (storingInSessionStorage) {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(mapped));
      }

      if (storingInLocalStorage && token) {
        const maxAge = 60 * 60 * 24 * 30;
        document.cookie = `rentsphere_token=${encodeURIComponent(token)}; Path=/; max-age=${maxAge};`;
      }

      return { success: true };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Profile update failed. Please try again.';
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    updateProfile,
    refreshUser,
    loading,
    isAuthenticated: !!user,
    initializing,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
