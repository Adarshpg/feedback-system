import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

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
          // Here you would typically verify the token with your backend
          // and get the user data
          // For now, we'll just set a dummy user
          setCurrentUser({ id: 'dummy-user-id' });
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

  // Login function
  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      const { token, userId } = response.data;
      setAuthToken(token);
      setCurrentUser({ id: userId });
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      await axios.post('http://localhost:5000/api/auth/register', userData);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
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
