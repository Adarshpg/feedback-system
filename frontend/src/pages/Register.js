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
  padding: theme => theme.spacing(3, 0),
});

const ContentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  padding: theme.spacing(4),
  backgroundColor: '#ffffff',
  color: theme.palette.text.primary,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  '& h2, & h3, & p, & li': {
    color: theme.palette.text.primary,
  },
  '& ul': {
    paddingLeft: theme.spacing(2),
    margin: 0,
    '& li': {
      color: theme.palette.text.secondary,
      marginBottom: theme.spacing(1.5),
    }
  },
  '& .MuiButton-outlined': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderColor: theme.palette.primary.dark,
    }
  }
}));

const FormSection = styled(Box)({
  padding: theme => theme.spacing(0, 3),
});

const StyledFormControl = styled(FormControl)({
  width: '100%',
  marginTop: 1,
  marginBottom: 1,
});

const validationSchema = Yup.object({
  fullName: Yup.string()
    .min(3, 'Full name must be at least 3 characters')
    .required('Full Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .min(6, 'Email must be at least 6 characters')
    .required('Email is required'),
  rollNumber: Yup.string().required('Roll Number is required'),
  collegeName: Yup.string().required('College Name is required'),
  contactNo: Yup.string()
    .matches(/^[0-9]{10}$/, 'Contact number must be 10 digits')
    .required('Contact Number is required'),
  dateOfBirth: Yup.date()
    .required('Date of Birth is required')
    .max(new Date(), 'Date of Birth cannot be in the future'),
  course: Yup.string().required('Course is required'),
  semester: Yup.number().required('Semester is required').min(1, 'Semester must be at least 1').max(8, 'Semester cannot be greater than 8'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  
  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      rollNumber: '',
      collegeName: '',
      contactNo: '',
      dateOfBirth: '',
      course: '',
      semester: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setFieldError }) => {
      setFormError('');
      setFieldErrors({});
      setLoading(true);

      try {
        const { confirmPassword, ...rest } = values;
        const userData = {
          ...rest,
          semester: parseInt(rest.semester, 10) || null,
        };
        
        const result = await register(userData);
        
        if (result.success) {
          navigate('/login', {
            state: { message: 'Registration successful! Please log in.' },
          });
        } else {
          if (result.field) {
            // Set field-specific error
            setFieldError(result.field, result.message);
            setFieldErrors(prev => ({
              ...prev,
              [result.field]: result.message
            }));
          } else if (result.isValidationError) {
            // Handle server-side validation errors
            setFormError(result.message);
          } else {
            setFormError(result.message || 'Registration failed');
          }
        }
      } catch (err) {
        console.error('Registration error:', err);
        setFormError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  const semesters = Array.from({ length: 8 }, (_, i) => i + 1); // Semesters 1-8

  return (
    <StyledContainer component="main" maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <FormSection>
            <StyledPaper elevation={3}>
              <Typography component="h1" variant="h5" align="center" gutterBottom>
                Create an Account
              </Typography>
          
          {formError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {formError}
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
                  error={(formik.touched.email && Boolean(formik.errors.email)) || Boolean(fieldErrors.email)}
                  helperText={(formik.touched.email && formik.errors.email) || fieldErrors.email}
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
                  error={(formik.touched.contactNo && Boolean(formik.errors.contactNo)) || Boolean(fieldErrors.contactNo)}
                  helperText={(formik.touched.contactNo && formik.errors.contactNo) || fieldErrors.contactNo}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Date of Birth *"
                  type="date"
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                  helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
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
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" variant="body2">
                  Sign In
                </Link>
              </Typography>
            </Box>
          </StyledForm>
            </StyledPaper>
          </FormSection>
        </Grid>
        <Grid item xs={12} md={6}>
          <ContentSection>
            <Typography variant="h4" gutterBottom>
              Welcome to Our Feedback System
            </Typography>
            <Typography variant="body1" paragraph>
              Join thousands of students who are improving their learning experience through valuable feedback.
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Why Register?
            </Typography>
            <ul>
              <li>Provide feedback at key milestones of your course</li>
              <li>Help improve course content and delivery</li>
              <li>Track your feedback history</li>
              <li>Contribute to better education for everyone</li>
            </ul>

            <Box mt={4}>
              <Typography variant="body2" fontStyle="italic">
                Your feedback helps us create a better learning environment for everyone.
              </Typography>
            </Box>
          </ContentSection>
        </Grid>
      </Grid>
    </StyledContainer>
  );
};

export default Register;
