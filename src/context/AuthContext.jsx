import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuthData, setAuthData, removeAuthData } from '../utils/auth';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { token: savedToken, user: savedUser } = getAuthData();
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setAuthData(token, userData);
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    removeAuthData();
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res?.data?.data) {
        const freshUser = res.data.data;
        // persist and propagate
        setAuthData(token, freshUser);
        setUser(freshUser);
      }
    } catch (e) {
      // handled globally by interceptor
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    isMitra: user?.role === 'mitra',
    refreshProfile,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};