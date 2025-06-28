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
const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(3, 0),
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 64px)',
  justifyContent: 'center',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  overflow: 'hidden',
}));

const StyledForm = styled('form')({
  width: '100%',
  marginTop: 1,
});

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  padding: theme.spacing(1.5),
  borderRadius: '8px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
}));

const ContentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(4),
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderRadius: theme.shape.borderRadius,
  '& h2, & h3, & p, & li': {
    color: 'white',
  },
  '& ul': {
    paddingLeft: theme.spacing(2),
    margin: 0,
  },
  '& li': {
    marginBottom: theme.spacing(1.5),
  },
}));

const FormSection = styled(Box)({
  padding: theme => theme.spacing(0, 3),
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
    <StyledContainer component="main" maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <FormSection>
            <StyledPaper elevation={3}>
              <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Welcome Back!
              </Typography>
              <Typography variant="body1" color="textSecondary" align="center" sx={{ mb: 4 }}>
                Sign in to access your feedback dashboard
              </Typography>
              
              {/* Success message after registration */}
              {successMessage && (
                <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
                  {successMessage}
                </Alert>
              )}
              
              {/* Error message */}
              {formError && (
                <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
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
                  sx={{ mb: 2 }}
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
                    sx={{ fontWeight: 500 }}
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
                  sx={{ 
                    mt: 2,
                    background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </StyledSubmitButton>
                <Box textAlign="center" mt={3}>
                  <Typography variant="body2" color="textSecondary">
                    Don't have an account?{' '}
                    <Link 
                      component={RouterLink} 
                      to="/register" 
                      variant="body2"
                      sx={{ fontWeight: 600, textDecoration: 'none' }}
                    >
                      Create an account
                    </Link>
                  </Typography>
                </Box>
              </StyledForm>
            </StyledPaper>
          </FormSection>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <ContentSection>
            <Typography variant="h4" component="h2" gutterBottom>
              Why Sign In?
            </Typography>
            <Typography variant="body1" paragraph>
              Access your personalized dashboard to track your feedback submissions and view your progress.
            </Typography>
            
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>Benefits of your account:</Typography>
              <ul>
                <li>Track your feedback submission history</li>
                <li>View your progress and completion status</li>
                <li>Access personalized recommendations</li>
                <li>Get notified about important updates</li>
                <li>Manage your account settings</li>
              </ul>
            </Box>
            
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>Need help?</Typography>
              <Typography variant="body2" paragraph>
                If you're having trouble signing in, please contact our support team for assistance.
              </Typography>
              <Button 
                variant="outlined" 
                color="inherit"
                sx={{ 
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  mt: 1,
                }}
              >
                Contact Support
              </Button>
            </Box>
          </ContentSection>
        </Grid>
      </Grid>
    </StyledContainer>
  );
};

export default Login;
