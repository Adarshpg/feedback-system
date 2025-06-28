import React, { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { styled } from '@mui/material/styles';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

// Styled components using the new MUI v5 approach
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}));

const StyledForm = styled('form')({
  width: '100%',
  marginTop: 1,
});

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}));

const StyledContainer = styled(Container)({
  marginTop: 8,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

// Validation schema using Yup
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

const Login = () => {
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the success message from the location state (e.g., after registration)
  const successMessage = location.state?.message;

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setFieldError }) => {
      setFormError('');
      setFieldErrors({});
      setIsSubmitting(true);

      try {
        const result = await login(values.email, values.password);
        
        if (result.success) {
          // Navigate to the dashboard or the intended destination
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        } else {
          if (result.field) {
            // Set field-specific error
            setFieldError(result.field, result.message);
            setFieldErrors(prev => ({
              ...prev,
              [result.field]: result.message
            }));
          } else {
            setFormError(result.message || 'Failed to log in');
          }
        }
      } catch (err) {
        console.error('Login error:', err);
        setFormError('An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <StyledContainer component="main" maxWidth="xs">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <StyledPaper elevation={3}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign In
          </Typography>
          
          {/* Success message after registration */}
          {successMessage && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          
          {/* Error message */}
          {formError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {formError}
            </Alert>
          )}
          
          <StyledForm onSubmit={formik.handleSubmit}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={(formik.touched.email && Boolean(formik.errors.email)) || Boolean(fieldErrors.email)}
              helperText={(formik.touched.email && formik.errors.email) || fieldErrors.email}
              disabled={isSubmitting}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={(formik.touched.password && Boolean(formik.errors.password)) || Boolean(fieldErrors.password)}
              helperText={(formik.touched.password && formik.errors.password) || fieldErrors.password}
              disabled={isSubmitting}
            />
            <Box textAlign="right" sx={{ mt: 1, mb: 2 }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                underline="hover"
              >
                Forgot password?
              </Link>
            </Box>
            <StyledSubmitButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </StyledSubmitButton>
            <Box textAlign="center" mt={2}>
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" variant="body2">
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </StyledForm>
        </StyledPaper>
      </Box>
    </StyledContainer>
  );
};

export default Login;
