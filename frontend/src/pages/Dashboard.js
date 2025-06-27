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
  marginTop: theme.spacing(2),
}));

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
});

const StyledProgress = styled(LinearProgress)({
  height: 10,
  borderRadius: 5,
  margin: '16px 0',
});

const PhaseTitle = styled(Typography)({
  display: 'flex',
  alignItems: 'center',
  marginBottom: 8,
});

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserFeedbacks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/feedback/user-feedbacks', {
          headers: {
            'x-auth-token': token,
          },
        });

        // Convert array of feedbacks to an object with phase as key
        const feedbacksObj = {};
        response.data.forEach(feedback => {
          feedbacksObj[feedback.phase] = feedback;
        });
        
        setFeedbacks(feedbacksObj);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
        setError('Failed to load your feedbacks. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserFeedbacks();
  }, [navigate]);

  const calculateProgress = () => {
    return (Object.keys(feedbacks).length / 3) * 100;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {currentUser?.fullName || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Track your feedback progress and submit new feedback for each phase.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <StyledPaper elevation={3}>
        <Typography variant="h6" gutterBottom>
          Your Progress
        </Typography>
        <Box sx={{ mt: 2, mb: 3 }}>
          <StyledProgress
            variant="determinate"
            value={calculateProgress()}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {Math.round(calculateProgress())}% Complete
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Object.keys(feedbacks).length} of 3 phases completed
            </Typography>
          </Box>
        </Box>
      </StyledPaper>

      <Grid container spacing={4}>
        {[1, 2, 3].map((phase) => {
          const isSubmitted = feedbacks[phase];
          const isAvailable = phase === 1 || feedbacks[phase - 1];
          
          return (
            <Grid item xs={12} md={4} key={phase}>
              <StyledCard 
                sx={{ 
                  opacity: isAvailable ? 1 : 0.7,
                }}
              >
                <StyledCardContent>
                  <PhaseTitle variant="h6" component="h2">
                    Phase {phase}
                    {isSubmitted ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Submitted"
                        color="success"
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    ) : (
                      <Chip
                        icon={<WarningIcon />}
                        label={isAvailable ? 'Pending' : 'Locked'}
                        color={isAvailable ? 'warning' : 'default'}
                        size="small"
                        sx={{ ml: 'auto' }}
                      />
                    )}
                  </PhaseTitle>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {phase === 1 
                      ? 'Initial feedback after 20% course completion' 
                      : phase === 2 
                        ? 'Mid-term feedback after 50% course completion' 
                        : 'Final feedback after 100% course completion'}
                  </Typography>
                  
                  {isSubmitted ? (
                    <Typography variant="body2" color="text.secondary">
                      Submitted on: {new Date(feedbacks[phase].submissionDate).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {isAvailable 
                        ? 'Ready to submit your feedback' 
                        : 'Complete previous phase first'}
                    </Typography>
                  )}
                </StyledCardContent>
                
                <CardActions sx={{ p: 2 }}>
                  <Button
                    variant={isSubmitted ? 'outlined' : 'contained'}
                    color="primary"
                    fullWidth
                    onClick={() => navigate(`/feedback/${phase}`)}
                    disabled={!isAvailable}
                  >
                    {isSubmitted ? 'View Feedback' : 'Submit Feedback'}
                  </Button>
                </CardActions>
              </StyledCard>
            </Grid>
          );
        })}
      </Grid>
      
      <Box mt={4}>
        <Paper elevation={3} style={{ padding: '1.5rem' }}>
          <Typography variant="h6" gutterBottom>
            Feedback Guidelines
          </Typography>
          <Typography paragraph>
            Please provide honest and constructive feedback for each phase of the course. 
            Your responses will help improve the course content and delivery.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Note: Once submitted, feedback cannot be modified. Please review your responses before submission.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
