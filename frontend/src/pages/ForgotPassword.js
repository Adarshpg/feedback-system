import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP and set new password
  const [contactNo, setContactNo] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/request-password-reset`, { contactNo });
      
      if (response.data.success) {
        setOtpSent(true);
        setSuccess('OTP sent to your phone number');
        startCountdown();
        setStep(2);
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/reset-password`, {
        contactNo,
        otp,
        newPassword
      });
      
      if (response.data.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = () => {
    if (countdown > 0) return;
    setError('');
    handleRequestOTP({ preventDefault: () => {} });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 4, fontWeight: 600 }}>
          Reset Your Password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {step === 1 ? (
          <Box component="form" onSubmit={handleRequestOTP}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Enter your registered phone number to receive an OTP for password reset.
            </Typography>
            
            <TextField
              fullWidth
              label="Phone Number"
              variant="outlined"
              margin="normal"
              value={contactNo}
              onChange={(e) => setContactNo(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 10-digit phone number"
              inputProps={{ maxLength: 10 }}
              required
              disabled={loading}
            />
            
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading || contactNo.length !== 10}
              sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
            
            <Button
              fullWidth
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleResetPassword}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We've sent an OTP to your phone number ending with {contactNo.slice(-3)}. Please enter it below.
            </Typography>
            
            <TextField
              fullWidth
              label="OTP"
              variant="outlined"
              margin="normal"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              inputProps={{ maxLength: 6 }}
              required
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="text"
              size="small"
              onClick={handleResendOTP}
              disabled={countdown > 0 || loading}
              sx={{ mb: 2, textTransform: 'none' }}
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Button>
            
            <TextField
              fullWidth
              label="New Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              disabled={loading}
              sx={{ mb: 3 }}
            />
            
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading || !otp || !newPassword || !confirmPassword}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
            
            <Button
              fullWidth
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ForgotPassword;
