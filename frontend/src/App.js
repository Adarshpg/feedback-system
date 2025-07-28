import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FeedbackForm from './pages/FeedbackForm';
import ForgotPassword from './pages/ForgotPassword';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ResumesDashboard from './components/ResumesDashboard';
import ResumesDashboardLogin from './pages/ResumesDashboardLogin';

const theme = createTheme({
  palette: {
    primary: {
      main: '#356575', // Darker version of the requested color
    },
    secondary: {
      main: '#4a90e2',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h6: {
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          '@media (max-width:600px)': {
            fontSize: '0.875rem',
            padding: '8px 16px',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            '& .MuiInputLabel-root': {
              fontSize: '0.875rem',
            },
            '& .MuiInputBase-input': {
              fontSize: '0.875rem',
            },
          },
        },
      },
    },
  },
});

// Private Route component for regular user authentication
const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

// Protected Route for resumes dashboard authentication
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('resumesAuth') === 'true';
  return isAuthenticated ? children : <Navigate to="/resumesdashboard/login" />;
};

// Redirect to login if trying to access login page while already authenticated
const ResumesLoginRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('resumesAuth') === 'true';
  return isAuthenticated ? <Navigate to="/resumesdashboard" /> : children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <div className="App">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/feedback/:phase"
              element={
                <PrivateRoute>
                  <FeedbackForm />
                </PrivateRoute>
              }
            />

            {/* Resumes Dashboard Routes */}
            <Route 
              path="/resumesdashboard/login" 
              element={
                <ResumesLoginRoute>
                  <ResumesDashboardLogin />
                </ResumesLoginRoute>
              } 
            />
            <Route
              path="/resumesdashboard/*"
              element={
                <ProtectedRoute>
                  <ResumesDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;