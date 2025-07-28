// In Register.js
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { 
  Lock, 
  Email, 
  Person, 
  Phone, 
  School, 
  CalendarToday, 
  Visibility, 
  VisibilityOff,
  Badge,
  Class,
  Event
} from '@mui/icons-material';

// Styled Components
const StyledContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: theme.spacing(3),
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("/bg-pattern.png") center/cover',
    opacity: 0.05,
    pointerEvents: 'none'
  }
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 1000,
  borderRadius: 20,
  overflow: 'hidden',
  display: 'flex',
  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    maxWidth: 500
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
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.primary.main,
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  padding: '14px 28px',
  borderRadius: 12,
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  marginTop: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.MuiButton-contained': {
    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
}));

const validationSchema = Yup.object({
  fullName: Yup.string().required('Full Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  rollNumber: Yup.string().required('Roll Number is required'),
  collegeName: Yup.string().required('College Name is required'),
  contactNo: Yup.string()
    .matches(/^[0-9]{10}$/, 'Invalid contact number')
    .required('Contact Number is required'),
  dateOfBirth: Yup.date().required('Date of Birth is required'),
  semester: Yup.number().required('Semester is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      rollNumber: '',
      collegeName: '',
      contactNo: '',
      dateOfBirth: '',
      semester: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values, { setFieldError }) => {
      setLoading(true);
      try {
        const { confirmPassword, ...userData } = values;
        const result = await register(userData);
        
        if (result.success) {
          navigate('/login', {
            state: { message: 'Registration successful! Please log in.' },
          });
        } else {
          if (result.field) {
            setFieldError(result.field, result.message);
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <StyledContainer component="main" maxWidth="xl">
      <GlassCard elevation={3}>
        <FormSection>
          <Box mb={4} textAlign="center">
            <Box mb={4} textAlign="center">
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" color="primary">
                Create an Account
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Join us today and start your journey
              </Typography>
            </Box>
          </Box>

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  id="fullName"
                  name="fullName"
                  label="Full Name"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                  helperText={formik.touched.fullName && formik.errors.fullName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  id="rollNumber"
                  name="rollNumber"
                  label="Roll Number"
                  value={formik.values.rollNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.rollNumber && Boolean(formik.errors.rollNumber)}
                  helperText={formik.touched.rollNumber && formik.errors.rollNumber}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  id="contactNo"
                  name="contactNo"
                  label="Contact Number"
                  value={formik.values.contactNo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactNo && Boolean(formik.errors.contactNo)}
                  helperText={formik.touched.contactNo && formik.errors.contactNo}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                  helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  error={formik.touched.course && Boolean(formik.errors.course)}
                >
                  <InputLabel>Course</InputLabel>
                  <Select
                    name="course"
                    value={formik.values.course}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Course"
                  >
                    <MenuItem value="B.Tech">B.Tech</MenuItem>
                    <MenuItem value="BBA">BBA</MenuItem>
                    <MenuItem value="BCA">BCA</MenuItem>
                    <MenuItem value="MBA">MBA</MenuItem>
                    <MenuItem value="MCA">MCA</MenuItem>
                    <MenuItem value="M.Tech">M.Tech</MenuItem>
                  </Select>
                  {formik.touched.course && formik.errors.course && (
                    <FormHelperText>{formik.errors.course}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  error={formik.touched.semester && Boolean(formik.errors.semester)}
                >
                  <InputLabel>Semester</InputLabel>
                  <Select
                    name="semester"
                    value={formik.values.semester}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Semester"
                  >
                    {semesters.map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.semester && formik.errors.semester && (
                    <FormHelperText>{formik.errors.semester}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  id="collegeName"
                  name="collegeName"
                  label="College Name"
                  value={formik.values.collegeName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.collegeName && Boolean(formik.errors.collegeName)}
                  helperText={formik.touched.collegeName && formik.errors.collegeName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <School color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
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
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)
                  }
                  helperText={
                    formik.touched.confirmPassword && formik.errors.confirmPassword
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <StyledButton
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                size="large"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </StyledButton>
            </Grid>

            <Box textAlign="center">
              <Typography variant="body2" color="textSecondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" color="primary">
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </FormSection>

        <ContentSection>
          <Box position="relative" zIndex={1} p={4}>
            <Box position="relative" zIndex={1} textAlign="center">
              <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                Welcome Back!
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4, opacity: 0.9 }}>
                To keep connected with us, please login with your personal info
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                color="inherit"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderWidth: 2,
                  borderRadius: 12,
                  fontWeight: 600,
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Sign In
              </Button>
            </Box>

            <Box mt={6}>
              <Typography variant="h6" gutterBottom fontWeight="bold" textAlign="center">
                Why join us?
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  bgcolor="rgba(255,255,255,0.2)"
                  width={32}
                  height={32}
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mr={2}
                  flexShrink={0}
                >
                  <Typography variant="body2" fontWeight="bold">1</Typography>
                </Box>
                <Typography>Access to exclusive resources</Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Box
                  bgcolor="rgba(255,255,255,0.2)"
                  width={32}
                  height={32}
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mr={2}
                  flexShrink={0}
                >
                  <Typography variant="body2" fontWeight="bold">2</Typography>
                </Box>
                <Typography>Connect with peers and mentors</Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <Box
                  bgcolor="rgba(255,255,255,0.2)"
                  width={32}
                  height={32}
                  borderRadius="50%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mr={2}
                  flexShrink={0}
                >
                  <Typography variant="body2" fontWeight="bold">3</Typography>
                </Box>
                <Typography>Track your academic progress</Typography>
              </Box>
            </Box>
          </Box>
        </ContentSection>
      </GlassCard>
    </StyledContainer>
  );
};

export default Register;