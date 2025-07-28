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
  InputAdornment,
  IconButton
} from '@mui/material';
import { Lock, Email, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

// Styled Components
const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(3)
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 1000,
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column'
  }
}));

const FormSection = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(6, 4),
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}));

const ContentSection = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(6, 4),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.1)'
  }
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '&:hover fieldset': {
      borderColor: theme.palette.primary.light,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
    },
  },
  marginBottom: theme.spacing(3),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: '14px 28px',
  borderRadius: 12,
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.MuiButton-contained': {
    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
  }
}));

// Validation Schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});
const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values, { setFieldError }) => {
      setFormError('');
      setIsSubmitting(true);

      try {
        const result = await login(values.email, values.password);
        if (result.success) {
          navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
        } else {
          setFormError(result.message || 'Invalid email or password');
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
    <StyledContainer maxWidth={false} disableGutters>
      <GlassCard elevation={0}>
        <FormSection>
          <Box maxWidth={400} mx="auto" width="100%">
            <Box textAlign="center" mb={4}>
              <Typography 
                variant="h4" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to continue to your account
              </Typography>
            </Box>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {successMessage}
              </Alert>
            )}

            {formError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {formError}
              </Alert>
            )}

            <form onSubmit={formik.handleSubmit}>
              <StyledTextField
                fullWidth
                id="email"
                name="email"
                label="Email Address"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <StyledTextField
                fullWidth
                id="password"
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                disabled={isSubmitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="large"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box display="flex" justifyContent="flex-end" mb={3}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  color="primary"
                  underline="hover"
                  sx={{ fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              </Box>

              <StyledButton
                fullWidth
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                size="large"
                sx={{ mb: 3 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </StyledButton>

              <Typography variant="body2" align="center" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  color="primary"
                  underline="hover"
                  sx={{ fontWeight: 600 }}
                >
                  Sign up
                </Link>
              </Typography>
            </form>
          </Box>
        </FormSection>

        <ContentSection>
          <Box maxWidth={400} mx="auto" position="relative" zIndex={1}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Join Our Community
            </Typography>
            <Typography variant="body1" paragraph sx={{ opacity: 0.9, mb: 4 }}>
              Connect with fellow students and share your valuable feedback to help us improve the learning experience.
            </Typography>
            
            <Box>
              {[
                "Track your feedback history",
                "Get personalized recommendations",
                "Help improve education quality"
              ].map((text, index) => (
                <Box key={index} display="flex" alignItems="center" mb={2}>
                  <Box
                    bgcolor="rgba(255, 255, 255, 0.2)"
                    width={40}
                    height={40}
                    borderRadius="50%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mr={2}
                  >
                    <Typography variant="h6" color="white">
                      {index + 1}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </ContentSection>
      </GlassCard>
    </StyledContainer>
  );
};

export default Login;