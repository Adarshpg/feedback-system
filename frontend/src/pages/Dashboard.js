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

  useEffect(() => {
    const fetchUserFeedbacks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !currentUser) {
          navigate('/login');
          return;
        }

        const [feedbacksResponse, statusResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/feedback/user-feedbacks`, {
            headers: { 'x-auth-token': token },
          }),
          axios.get(`${process.env.REACT_APP_API_URL}/feedback/status`, {
            headers: { 'x-auth-token': token },
          })
        ]);

        // Convert array of feedbacks to an object with semester as key
        const feedbacksObj = {};
        feedbacksResponse.data.forEach(feedback => {
          feedbacksObj[feedback.semester] = feedback;
        });
        
        setFeedbacks(feedbacksObj);
        setProgress(statusResponse.data.progress);
        setNextFeedback(statusResponse.data.nextFeedback || 1);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
        setError('Failed to load your feedbacks. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserFeedbacks();
  }, [navigate, currentUser]);

  // Use the progress state from the backend

  // Determine which feedback form to show based on progress
  const getAvailableFeedbacks = () => {
    const completedCount = Object.keys(feedbacks).length;
    
    // If all 3 feedbacks are submitted, show all
    if (completedCount >= 3) {
      return [1, 2, 3].map(semester => ({
        id: semester,
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
      // The next feedback after the last submitted one should be available
      const isNextInSequence = semester === (completedCount + 1);
      // Any previous feedbacks should be available
      const isPrevious = semester <= completedCount;
      
      return {
        id: semester,
        label: semester === 1 ? 'Initial Feedback (20% Complete)' : 
               semester === 2 ? 'Mid-Course Feedback (50% Complete)' :
               'Final Feedback (100% Complete)',
        isSubmitted: isSubmitted,
        isAvailable: isSubmitted || isNextInSequence || isPrevious
      };
    });
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

      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600, color: 'text.primary' }}>
          Course Feedback Milestones
        </Typography>
        <Grid container spacing={3}>
          {getAvailableFeedbacks().map((feedback) => (
            <Grid item xs={12} md={4} key={feedback.id}>
              <StyledCard 
                sx={{ 
                  opacity: feedback.isAvailable ? 1 : 0.7,
                  height: '100%',
                  background: feedback.isAvailable 
                    ? 'linear-gradient(145deg, #ffffff, #f8f9ff)'
                    : 'linear-gradient(145deg, #f8f9ff, #f0f2f5)'
                }}
              >
                <StyledCardContent>
                  <PhaseTitle variant="h6" component="h2">
                    {feedback.label.split(' (')[0]}
                    {feedback.isSubmitted ? (
                      <Chip
                        icon={<CheckCircleIcon style={{ color: '#4caf50' }} />}
                        label="Submitted"
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<WarningIcon style={{ 
                          color: feedback.isAvailable ? '#ed6c02' : '#9e9e9e' 
                        }} />}
                        label={feedback.isAvailable ? 'Pending' : 'Locked'}
                        color={feedback.isAvailable ? 'warning' : 'default'}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </PhaseTitle>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 2,
                    '& .MuiLinearProgress-root': {
                      flexGrow: 1,
                      height: 6,
                      borderRadius: 3,
                      mr: 1,
                    }
                  }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={feedback.id === 1 ? 20 : feedback.id === 2 ? 50 : 100}
                      color={feedback.isSubmitted ? 'success' : 'primary'}
                      sx={{
                        backgroundColor: theme => theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          background: feedback.isSubmitted 
                            ? 'linear-gradient(90deg, #4caf50, #81c784)'
                            : 'linear-gradient(90deg, #1976d2, #64b5f6)',
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                      {feedback.id === 1 ? '20%' : feedback.id === 2 ? '50%' : '100%'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2, minHeight: 48 }}>
                    {feedback.id === 1 
                      ? 'Share your initial thoughts after completing the first 20% of the course.' 
                      : feedback.id === 2 
                        ? 'Provide mid-course feedback after reaching the 50% completion mark.'
                        : 'Share your final thoughts after completing the entire course.'}
                  </Typography>
                  
                  {feedback.isSubmitted ? (
                    <Box sx={{ 
                      backgroundColor: 'success.50',
                      p: 1.5,
                      borderRadius: 1,
                      borderLeft: '4px solid',
                      borderColor: 'success.main',
                      mb: 2
                    }}>
                      <Typography variant="body2" sx={{ color: 'success.dark', display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} />
                        Submitted on {new Date(feedbacks[feedback.id].submissionDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: feedback.isAvailable ? 'warning.dark' : 'text.disabled',
                        fontStyle: 'italic',
                        mb: 2,
                        minHeight: 40,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {feedback.isAvailable 
                        ? '✓ Ready to collect your feedback' 
                        : '🔒 Complete previous milestone to unlock'}
                    </Typography>
                  )}
                </StyledCardContent>
                
                {!feedback.isSubmitted && (
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={!feedback.isAvailable}
                      onClick={() => navigate(`/feedback/${feedback.id}`)}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 500,
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme => `0 4px 12px ${theme.palette.primary.light}40`,
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'action.disabledBackground',
                          color: 'text.disabled',
                        },
                      }}
                      startIcon={<WarningIcon />}
                    >
                      Provide Feedback
                    </Button>
                  </CardActions>
                )}
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      </Box>
      
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
