import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Set base URL for API requests
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://feedback-system-1-jqqj.onrender.com' // Render backend URL
  : 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

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
          const response = await axios.get('/api/auth/me');
          if (response.data.user) {
            setCurrentUser(response.data.user);
          } else {
            // If no user data is returned, clear the token
            setAuthToken(null);
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        // If there's an error (e.g., token is invalid), clear everything
        setAuthToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Log the current environment for debugging
  console.log('Running in', process.env.NODE_ENV, 'mode');
  console.log('API Base URL:', API_BASE_URL);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token, user } = response.data;
      setAuthToken(token);
      setCurrentUser(user || { id: user?._id });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle field-specific errors
      if (error.response?.data?.field) {
        return {
          success: false,
          message: error.response.data.message,
          field: error.response.data.field
        };
      }
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        return {
          success: false,
          message: error.response.data.errors.join(' '),
          isValidationError: true
        };
      }
      
      // Handle network errors
      if (error.message === 'Network Error') {
        return {
          success: false,
          message: 'Unable to connect to the server. Please check your internet connection.'
        };
      }
      
      // Handle other errors
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return { 
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle field-specific errors (e.g., duplicate email)
      if (error.response?.data?.field) {
        return {
          success: false,
          message: error.response.data.message,
          field: error.response.data.field
        };
      }
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        return {
          success: false,
          message: error.response.data.errors.join(' '),
          isValidationError: true
        };
      }
      
      // Handle other errors
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
