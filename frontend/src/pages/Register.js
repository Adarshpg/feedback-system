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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

// Styled components using the new MUI v5 approach
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0, 8, 0),
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
  marginTop: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const StyledFormControl = styled(FormControl)({
  width: '100%',
  marginTop: 1,
  marginBottom: 1,
});

const validationSchema = Yup.object({
  fullName: Yup.string().required('Full Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  rollNumber: Yup.string().required('Roll Number is required'),
  collegeName: Yup.string().required('College Name is required'),
  contactNo: Yup.string()
    .matches(/^[0-9]{10}$/, 'Contact number must be 10 digits')
    .required('Contact Number is required'),
  course: Yup.string().required('Course is required'),
  semester: Yup.number().required('Semester is required').min(1).max(12),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const Register = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      rollNumber: '',
      collegeName: '',
      contactNo: '',
      course: '',
      semester: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setError('');
      setLoading(true);

      try {
        const { confirmPassword, ...userData } = values;
        const result = await register(userData);
        
        if (result.success) {
          navigate('/login', {
            state: { message: 'Registration successful! Please log in.' },
          });
        } else {
          setError(result.message || 'Registration failed');
        }
      } catch (err) {
        setError('Failed to create an account. Please try again.');
        console.error('Registration error:', err);
      } finally {
        setLoading(false);
      }
    },
  });

  const semesters = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <StyledContainer component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <StyledPaper elevation={3}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Create an Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <StyledForm onSubmit={formik.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="fullName"
                  name="fullName"
                  label="Full Name *"
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                  helperText={formik.touched.fullName && formik.errors.fullName}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email *"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="rollNumber"
                  name="rollNumber"
                  label="Roll Number *"
                  value={formik.values.rollNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.rollNumber && Boolean(formik.errors.rollNumber)}
                  helperText={formik.touched.rollNumber && formik.errors.rollNumber}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="collegeName"
                  name="collegeName"
                  label="College Name *"
                  value={formik.values.collegeName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.collegeName && Boolean(formik.errors.collegeName)}
                  helperText={formik.touched.collegeName && formik.errors.collegeName}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactNo"
                  name="contactNo"
                  label="Contact No *"
                  value={formik.values.contactNo}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.contactNo && Boolean(formik.errors.contactNo)}
                  helperText={
                    formik.touched.contactNo && formik.errors.contactNo
                      ? formik.errors.contactNo
                      : 'Enter your 10-digit mobile number'
                  }
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="course"
                  name="course"
                  label="Course *"
                  value={formik.values.course}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.course && Boolean(formik.errors.course)}
                  helperText={formik.touched.course && formik.errors.course}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl
                  fullWidth
                  margin="normal"
                  error={formik.touched.semester && Boolean(formik.errors.semester)}
                >
                  <InputLabel id="semester-label">Semester *</InputLabel>
                  <Select
                    labelId="semester-label"
                    id="semester"
                    name="semester"
                    value={formik.values.semester}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Semester *"
                  >
                    {semesters.map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.semester && formik.errors.semester && (
                    <FormHelperText error>{formik.errors.semester}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password *"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password *"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.confirmPassword &&
                    Boolean(formik.errors.confirmPassword)
                  }
                  helperText={
                    formik.touched.confirmPassword && formik.errors.confirmPassword
                  }
                  margin="normal"
                />
              </Grid>
            </Grid>
            
            <StyledSubmitButton
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading || !formik.isValid}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </StyledSubmitButton>
            
            <Box textAlign="center" mt={2}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </StyledForm>
        </StyledPaper>
      </Box>
    </StyledContainer>
  );
};

export default Register;
