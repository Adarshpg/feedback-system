import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  LinearProgress,
  Chip,
  Grid,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Styled components using the new MUI v5 approach
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  borderRadius: '12px',
  background: 'linear-gradient(145deg, #ffffff, #f0f2f5)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  overflow: 'hidden',
  transition: 'all 0.3s ease-in-out',
  border: '1px solid rgba(0, 0, 0, 0.05)',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.1)',
  },
  '&.MuiCard-root': {
    display: 'flex',
    flexDirection: 'column',
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  '&:last-child': {
    paddingBottom: theme.spacing(3),
  }
}));

const StyledProgress = styled(LinearProgress)(({ theme, value }) => ({
  height: 12,
  borderRadius: 6,
  margin: '20px 0',
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
    background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    boxShadow: `0 0 10px ${theme.palette.primary.light}`,
  },
}));

const PhaseTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.text.primary,
  '& .MuiChip-root': {
    marginLeft: 'auto',
    fontWeight: 500,
    height: 24,
  },
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  margin: theme.spacing(3, 0),
  '& > *': {
    position: 'relative',
    zIndex: 1
  }
}));

const MilestoneDot = styled('div')(({ theme, active }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[300],
  border: `3px solid ${active ? theme.palette.primary.light : '#fff'}`,
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
  boxShadow: active ? `0 0 0 4px ${theme.palette.primary.light}40` : 'none',
  transition: 'all 0.3s ease',
}));

const MilestoneLabel = styled(Typography)(({ theme, active }) => ({
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: '50%',
  transform: 'translateX(-50%)',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  fontWeight: active ? 600 : 400,
  whiteSpace: 'nowrap',
  fontSize: '0.75rem',
}));

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [progress, setProgress] = useState(0);
  const [nextFeedback, setNextFeedback] = useState(1);
  
  // Resume upload state
  const [resumeFile, setResumeFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    const fetchUserFeedbacks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !currentUser) {
          navigate('/login');
          return;
        }

        // Ensure API URL is defined
        const API_URL = process.env.REACT_APP_API_URL || 'https://feedback-system-1-jqqj.onrender.com/api';
        
        // Clean up any double slashes in the URL
        const cleanApiUrl = API_URL.replace(/([^:]\/)\/+/g, '$1');
        
        const [feedbacksResponse, statusResponse] = await Promise.all([
          axios.get(`${cleanApiUrl}/feedback/user-feedbacks`, {
            headers: { 
              'x-auth-token': token,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }),
          axios.get(`${cleanApiUrl}/feedback/status`, {
            headers: { 
              'x-auth-token': token,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          })
        ]);

        // Convert array of feedbacks to an object with semester as key
        const feedbacksObj = {};
        if (feedbacksResponse.data && Array.isArray(feedbacksResponse.data)) {
          feedbacksResponse.data.forEach(feedback => {
            feedbacksObj[feedback.semester] = feedback;
          });
        }
        
        setFeedbacks(feedbacksObj);
        
        if (statusResponse.data) {
          setProgress(statusResponse.data.progress || 0);
          setNextFeedback(statusResponse.data.nextFeedback || 1);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
        setError(`Failed to load your feedbacks: ${err.message || 'Unknown error'}`);
        setLoading(false);
      }
    };

    fetchUserFeedbacks();
  }, [navigate, currentUser]);

  // Use the progress state from the backend

  // Determine which feedback form to show based on progress
  const getAvailableFeedbacks = () => {
    const completedCount = Object.keys(feedbacks).filter(key => key !== 'resumeUpload').length;
    const isResumeSubmitted = !!feedbacks.resumeUpload?.filePath;
    
    // If all 3 feedbacks are submitted, show all
    if (completedCount >= 3) {
      return [1, 2, 3].map(semester => ({
        id: semester,
        title: semester === 1 ? 'Initial Feedback (20%)' : 
               semester === 2 ? 'Mid-Course Feedback (50%)' :
               'Final Feedback (100%)',
        label: semester === 1 ? 'Initial Feedback (20% Complete)' : 
               semester === 2 ? 'Mid-Course Feedback (50% Complete)' :
               'Final Feedback (100% Complete)',
        isSubmitted: !!feedbacks[semester],
        isAvailable: true
      }));
    }
    
    // Otherwise, determine which feedbacks should be available
    return [1, 2, 3].map(semester => {
      // If this feedback is already submitted, it should be available
      const isSubmitted = !!feedbacks[semester];
      
      // For Final Feedback (semester 3), it's only available if resume is submitted
      if (semester === 3) {
        return {
          id: semester,
          title: 'Final Feedback (100%)',
          label: 'Final Feedback (100% Complete)',
          isSubmitted: isSubmitted,
          isAvailable: isSubmitted || isResumeSubmitted
        };
      }
      
      // For other feedbacks, use the original logic
      const isNextInSequence = semester === (completedCount + 1);
      const isPrevious = semester <= completedCount;
      
      return {
        id: semester,
        title: semester === 1 ? 'Initial Feedback (20%)' : 'Mid-Course Feedback (50%)',
        label: semester === 1 ? 'Initial Feedback (20% Complete)' : 'Mid-Course Feedback (50% Complete)',
        isSubmitted: isSubmitted,
        isAvailable: isSubmitted || isNextInSequence || isPrevious
      };
    });
  };

  const renderMilestoneCards = () => {
    const feedbackCards = getAvailableFeedbacks();
    const cards = [];
    
    // Render Initial Feedback (20%) - Card 1
    const initialFeedback = feedbackCards.find(f => f.id === 1);
    if (initialFeedback) {
      cards.push(
        <Grid item xs={12} md={3} key={initialFeedback.id}>
          <StyledCard
            sx={{
              backgroundColor: initialFeedback.isSubmitted 
                ? 'success.50' 
                : initialFeedback.isAvailable 
                  ? 'warning.50' 
                  : 'linear-gradient(145deg, #f8f9ff, #f0f2f5)'
            }}
          >
            <StyledCardContent>
              <PhaseTitle variant="h6" component="h2">
                {initialFeedback.title}
                {initialFeedback.isSubmitted ? (
                  <Chip
                    icon={<CheckCircleIcon style={{ color: '#4caf50' }} />}
                    label="Submitted"
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<WarningIcon style={{ color: initialFeedback.isAvailable ? '#ed6c02' : '#9e9e9e' }} />}
                    label={initialFeedback.isAvailable ? 'Pending' : 'Locked'}
                    color={initialFeedback.isAvailable ? 'warning' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                )}
              </PhaseTitle>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={20}
                  color={initialFeedback.isSubmitted ? 'success' : 'primary'}
                  sx={{ flexGrow: 1, height: 6, borderRadius: 3, mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                  20%
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2, minHeight: 48 }}>
                Share your initial thoughts after completing the first 20% of the course.
              </Typography>
              
              {initialFeedback.isSubmitted ? (
                <Box sx={{ backgroundColor: 'success.50', p: 1.5, borderRadius: 1, borderLeft: '4px solid', borderColor: 'success.main', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                    Submitted on {new Date(feedbacks[initialFeedback.id].submissionDate).toLocaleDateString()}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: initialFeedback.isAvailable ? 'warning.dark' : 'text.disabled', fontStyle: 'italic', mb: 2, minHeight: 40, display: 'flex', alignItems: 'center' }}>
                  {initialFeedback.isAvailable ? '✓ Ready to collect your feedback' : '🔒 Complete previous milestone to unlock'}
                </Typography>
              )}
            </StyledCardContent>
            
            {!initialFeedback.isSubmitted && (
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!initialFeedback.isAvailable}
                  onClick={() => navigate(`/feedback/${initialFeedback.id}`)}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  startIcon={<WarningIcon />}
                >
                  Provide Feedback
                </Button>
              </CardActions>
            )}
          </StyledCard>
        </Grid>
      );
    }
    
    // Render Mid-Course Feedback (50%) - Card 2
    const midFeedback = feedbackCards.find(f => f.id === 2);
    if (midFeedback) {
      cards.push(
        <Grid item xs={12} md={3} key={midFeedback.id}>
          <StyledCard
            sx={{
              backgroundColor: midFeedback.isSubmitted 
                ? 'success.50' 
                : midFeedback.isAvailable 
                  ? 'warning.50' 
                  : 'linear-gradient(145deg, #f8f9ff, #f0f2f5)'
            }}
          >
            <StyledCardContent>
              <PhaseTitle variant="h6" component="h2">
                {midFeedback.title}
                {midFeedback.isSubmitted ? (
                  <Chip
                    icon={<CheckCircleIcon style={{ color: '#4caf50' }} />}
                    label="Submitted"
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<WarningIcon style={{ color: midFeedback.isAvailable ? '#ed6c02' : '#9e9e9e' }} />}
                    label={midFeedback.isAvailable ? 'Pending' : 'Locked'}
                    color={midFeedback.isAvailable ? 'warning' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                )}
              </PhaseTitle>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={50}
                  color={midFeedback.isSubmitted ? 'success' : 'primary'}
                  sx={{ flexGrow: 1, height: 6, borderRadius: 3, mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                  50%
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2, minHeight: 48 }}>
                Provide mid-course feedback after reaching the 50% completion mark.
              </Typography>
              
              {midFeedback.isSubmitted ? (
                <Box sx={{ backgroundColor: 'success.50', p: 1.5, borderRadius: 1, borderLeft: '4px solid', borderColor: 'success.main', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                    Submitted on {new Date(feedbacks[midFeedback.id].submissionDate).toLocaleDateString()}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: midFeedback.isAvailable ? 'warning.dark' : 'text.disabled', fontStyle: 'italic', mb: 2, minHeight: 40, display: 'flex', alignItems: 'center' }}>
                  {midFeedback.isAvailable ? '✓ Ready to collect your feedback' : '🔒 Complete previous milestone to unlock'}
                </Typography>
              )}
            </StyledCardContent>
            
            {!midFeedback.isSubmitted && (
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!midFeedback.isAvailable}
                  onClick={() => navigate(`/feedback/${midFeedback.id}`)}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  startIcon={<WarningIcon />}
                >
                  Provide Feedback
                </Button>
              </CardActions>
            )}
          </StyledCard>
        </Grid>
      );
    }
    
    // Render Resume Upload - Card 3
    cards.push(
      <Grid item xs={12} md={3} key="resume-upload">
        <StyledCard>
          <StyledCardContent>
            <PhaseTitle variant="h6" component="h2">
              Resume Upload
              {feedbacks.resumeUpload?.filePath ? (
                <Chip
                  icon={<CheckCircleIcon style={{ color: '#4caf50' }} />}
                  label="Submitted"
                  color="success"
                  variant="outlined"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<WarningIcon style={{ color: feedbacks[2] ? '#ed6c02' : '#9e9e9e' }} />}
                  label={feedbacks[2] ? 'Pending' : 'Locked'}
                  color={feedbacks[2] ? 'warning' : 'default'}
                  variant="outlined"
                  size="small"
                />
              )}
            </PhaseTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={feedbacks.resumeUpload?.filePath ? 100 : feedbacks[2] ? 50 : 0}
                color={feedbacks.resumeUpload?.filePath ? 'success' : 'primary'}
                sx={{ flexGrow: 1, height: 6, borderRadius: 3, mr: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                {feedbacks.resumeUpload?.filePath ? '100%' : feedbacks[2] ? '50%' : '0%'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2, minHeight: 48 }}>
              Upload your resume after submitting your Mid-Course Feedback. Accepted formats: PDF, DOC, DOCX.
            </Typography>
            {feedbacks.resumeUpload?.filePath ? (
              <Box sx={{ backgroundColor: 'success.50', p: 1.5, borderRadius: 1, borderLeft: '4px solid', borderColor: 'success.main', mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                  Resume submitted
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  href={feedbacks.resumeUpload.filePath}
                  target="_blank"
                  sx={{ mt: 1 }}
                >
                  View Uploaded Resume
                </Button>
              </Box>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: feedbacks[2] ? 'warning.dark' : 'text.disabled',
                  fontStyle: 'italic',
                  mb: 2,
                  minHeight: 40,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {feedbacks[2]
                  ? '✓ Ready to upload your resume'
                  : '🔒 Complete Mid-Course Feedback to unlock'}
              </Typography>
            )}
          </StyledCardContent>
          {!feedbacks.resumeUpload?.filePath && feedbacks[2] && (
            <CardActions sx={{ p: 2, pt: 0, flexDirection: 'column', alignItems: 'flex-start' }}>
              <input
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="resume-upload-card"
                type="file"
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) setResumeFile(file);
                }}
              />
              <label htmlFor="resume-upload-card">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<WarningIcon />}
                  sx={{ mb: 1 }}
                >
                  Choose File
                </Button>
              </label>
              <Button
                variant="contained"
                color="primary"
                onClick={async () => {
                  if (!resumeFile) return;
                  setIsUploading(true);
                  setUploadStatus({ type: '', message: '' });
                  const formData = new FormData();
                  formData.append('resume', resumeFile);
                  try {
                    // Since axios.defaults.baseURL is already set to include /api in AuthContext,
                    // we just need to use the relative path
                    const token = localStorage.getItem('token');
                    const response = await axios.post('/upload-resume', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                      }
                    });
                    setUploadStatus({ type: 'success', message: 'Resume uploaded successfully!' });
                    setResumeFile(null);
                    setFeedbacks(prev => ({ ...prev, resumeUpload: { filePath: response.data.filePath } }));
                  } catch (error) {
                    setUploadStatus({ type: 'error', message: error.response?.data?.message || 'Upload failed' });
                  } finally {
                    setIsUploading(false);
                  }
                }}
                disabled={!resumeFile || isUploading}
                startIcon={isUploading ? <CircularProgress size={20} /> : <WarningIcon />}
              >
                {isUploading ? 'Uploading...' : 'Upload Resume'}
              </Button>
              {resumeFile && (
                <Typography variant="caption" sx={{ mt: 1 }}>
                  Selected: {resumeFile.name}
                </Typography>
              )}
              {uploadStatus.message && (
                <Typography
                  color={uploadStatus.type === 'error' ? 'error' : 'success'}
                  variant="caption"
                  sx={{ mt: 1, display: 'block' }}
                >
                  {uploadStatus.message}
                </Typography>
              )}
            </CardActions>
          )}
        </StyledCard>
      </Grid>
    );
    
    // Render Final Feedback (100%) - Card 4
    const finalFeedback = feedbackCards.find(f => f.id === 3);
    if (finalFeedback) {
      cards.push(
        <Grid item xs={12} md={3} key={finalFeedback.id}>
          <StyledCard
            sx={{
              backgroundColor: finalFeedback.isSubmitted 
                ? 'success.50' 
                : finalFeedback.isAvailable 
                  ? 'warning.50' 
                  : 'linear-gradient(145deg, #f8f9ff, #f0f2f5)'
            }}
          >
            <StyledCardContent>
              <PhaseTitle variant="h6" component="h2">
                {finalFeedback.title}
                {finalFeedback.isSubmitted ? (
                  <Chip
                    icon={<CheckCircleIcon style={{ color: '#4caf50' }} />}
                    label="Submitted"
                    color="success"
                    variant="outlined"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<WarningIcon style={{ color: finalFeedback.isAvailable ? '#ed6c02' : '#9e9e9e' }} />}
                    label={finalFeedback.isAvailable ? 'Pending' : 'Locked'}
                    color={finalFeedback.isAvailable ? 'warning' : 'default'}
                    variant="outlined"
                    size="small"
                  />
                )}
              </PhaseTitle>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={100}
                  color={finalFeedback.isSubmitted ? 'success' : 'primary'}
                  sx={{ flexGrow: 1, height: 6, borderRadius: 3, mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                  100%
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2, minHeight: 48 }}>
                Share your final thoughts after completing the entire course and uploading your resume.
              </Typography>
              
              {finalFeedback.isSubmitted ? (
                <Box sx={{ backgroundColor: 'success.50', p: 1.5, borderRadius: 1, borderLeft: '4px solid', borderColor: 'success.main', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                    Submitted on {new Date(feedbacks[finalFeedback.id].submissionDate).toLocaleDateString()}
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: finalFeedback.isAvailable ? 'warning.dark' : 'text.disabled', fontStyle: 'italic', mb: 2, minHeight: 40, display: 'flex', alignItems: 'center' }}>
                  {finalFeedback.isAvailable ? '✓ Ready to collect your feedback' : '🔒 Upload your resume to unlock'}
                </Typography>
              )}
            </StyledCardContent>
            
            {!finalFeedback.isSubmitted && (
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!finalFeedback.isAvailable}
                  onClick={() => navigate(`/feedback/${finalFeedback.id}`)}
                  sx={{ py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                  startIcon={<WarningIcon />}
                >
                  Provide Feedback
                </Button>
              </CardActions>
            )}
          </StyledCard>
        </Grid>
      );
    }
    
    return cards;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700, 
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            '&:after': {
              content: '""',
              flex: 1,
              ml: 2,
              height: '1px',
              backgroundColor: 'divider',
            }
          }}
        >
          Welcome back, {currentUser?.fullName?.split(' ')[0] || 'Student'}! 👋
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            fontWeight: 400,
            maxWidth: '800px',
            lineHeight: 1.6,
            mb: 2
          }}
        >
          Track your feedback progress and submit new feedback at key milestones of your course journey.
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem',
              alignItems: 'center',
            }
          }}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {renderMilestoneCards()}
      </Grid>

      <StyledPaper sx={{ background: 'linear-gradient(135deg, #f5f7ff 0%, #f0f4ff 100%)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center' }}>
          <Box sx={{ flex: 1, pr: { md: 4 } }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'primary.dark' }}>
              Your Feedback Matters
            </Typography>
            <Typography paragraph sx={{ color: 'text.secondary', mb: 2 }}>
              We value your input! Your feedback helps us enhance the learning experience for you and future students.
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 3,
              '& li': {
                mb: 1,
                display: 'flex',
                alignItems: 'flex-start',
                '&:before': {
                  content: '"✓"',
                  color: 'success.main',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  width: '1.5em',
                  ml: -1.5,
                }
              }
            }}>
              <li>Help improve course content and teaching methods</li>
              <li>Influence future curriculum development</li>
              <li>Make a difference for future students</li>
            </Box>
            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.3)',
                },
              }}
              onClick={() => {
                const nextFeedback = getAvailableFeedbacks().find(f => f.isAvailable && !f.isSubmitted);
                if (nextFeedback) {
                  navigate(`/feedback/${nextFeedback.id}`);
                }
              }}
            >
              {getAvailableFeedbacks().some(f => f.isAvailable && !f.isSubmitted) 
                ? 'Submit Your Feedback Now' 
                : 'View Your Submissions'}
            </Button>
          </Box>
          <Box sx={{ 
            flexShrink: 0, 
            width: { xs: '100%', md: '40%' },
            mt: { xs: 4, md: 0 },
            textAlign: 'center',
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: 2,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            }
          }}>
            <img 
              src="https://img.freepik.com/free-vector/feedback-concept-illustration_114360-4925.jpg" 
              alt="Feedback illustration" 
              style={{ maxHeight: '280px' }}
            />
          </Box>
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default Dashboard;
