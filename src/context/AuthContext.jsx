import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Base URL of deployed backend
const API_BASE_URL = 'https://accounting-backend-uevd.onrender.com/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults when token changes.
  // We intentionally depend only on `token` here to avoid
  // re-running this effect on every render due to `loadUser`'s
  // changing function identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/profile`);
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, userData);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        return { success: true };
      }
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/users/profile`, profileData);

      if (response.data.success) {
        setUser(response.data.data);
        return { success: true, message: 'Profile updated successfully' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/users/change-password`, {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        return { success: true, message: 'Password changed successfully' };
      }
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
