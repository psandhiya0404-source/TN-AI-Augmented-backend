import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Session check failed:', err.message);
      localStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('accessToken', res.data.accessToken);
        setUser(res.data.user);
        showSuccess(`Welcome back, ${res.data.user.name}! 🔥`);
        await checkAuth();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      showError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        localStorage.setItem('accessToken', res.data.accessToken);
        setUser(res.data.user);
        showSuccess('Account created successfully! Welcome to Study Buddy 🚀');
        await checkAuth();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      showError(msg);
      return { success: false, error: msg };
    }
  };

  const updateProfile = async (formData) => {
    try {
      const res = await api.put('/auth/profile', formData);
      if (res.data.success) {
        setUser(res.data.user);
        showSuccess('Profile updated successfully!');
        await checkAuth();
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Profile update failed.';
      showError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setStats(null);
      showSuccess('Logged out safely.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        loading,
        login,
        register,
        updateProfile,
        logout,
        refreshProfile: checkAuth,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
