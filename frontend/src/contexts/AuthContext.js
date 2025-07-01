import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Set base URL for API requests
const API_BASE_URL = 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
console.log('Using API base URL:', API_BASE_URL);

// Optional: request interceptor (if needed)
axios.interceptors.request.use(config => {
  config.url = config.url.replace(/^\/+/, ''); // Remove leading slashes
  return config;
});

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set auth token for axios
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['auth-token'];
      localStorage.removeItem('token');
    }
    setToken(token);
  };

  // Check if user is logged in on initial load
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setAuthToken(storedToken);

          // Verify token with backend
          const response = await axios.get('/auth/me');
          if (response.data.user) {
            setCurrentUser(response.data.user);
          } else {
            setAuthToken(null);
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        setAuthToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Log current environment
  console.log('Running in', process.env.NODE_ENV, 'mode');

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, user } = response.data;
      setAuthToken(token);
      setCurrentUser(user || { id: user?._id });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);

      if (error.response?.data?.field) {
        return {
          success: false,
          message: error.response.data.message,
          field: error.response.data.field
        };
      }

      if (error.response?.data?.errors) {
        return {
          success: false,
          message: error.response.data.errors.join(' '),
          isValidationError: true
        };
      }

      if (error.message === 'Network Error') {
        return {
          success: false,
          message: 'Unable to connect to the server. Please check your internet connection.'
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response?.data?.field) {
        return {
          success: false,
          message: error.response.data.message,
          field: error.response.data.field
        };
      }

      if (error.response?.data?.errors) {
        return {
          success: false,
          message: error.response.data.errors.join(' '),
          isValidationError: true
        };
      }

      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  // Logout function
  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
