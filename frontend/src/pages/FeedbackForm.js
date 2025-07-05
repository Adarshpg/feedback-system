import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Paper,
  Button,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  IconButton,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Styled components
const PREFIX = 'FeedbackForm';
const classes = {
  paper: `${PREFIX}-paper`,
  stepper: `${PREFIX}-stepper`,
  buttons: `${PREFIX}-buttons`,
  question: `${PREFIX}-question`,
  successIcon: `${PREFIX}-successIcon`,
  dialogContent: `${PREFIX}-dialogContent`,
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.paper}`]: {
    padding: theme.spacing(4),
    marginTop: theme.spacing(2),
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[3],
  },
  [`& .${classes.stepper}`]: {
    padding: theme.spacing(3, 0, 5),
    '& .MuiStepIcon-root.Mui-completed': {
      color: theme.palette.success.main,
    },
    '& .MuiStepIcon-root.Mui-active': {
      color: theme.palette.primary.main,
    },
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(4),
    '& > *': {
      marginLeft: theme.spacing(1),
    },
  },
  [`& .${classes.question}`]: {
    marginBottom: theme.spacing(4),
    padding: theme.spacing(3),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
  },
  [`& .${classes.successIcon}`]: {
    fontSize: 60,
    color: theme.palette.success.main,
    marginBottom: theme.spacing(2),
  },
  [`& .${classes.dialogContent}`]: {
    textAlign: 'center',
    padding: theme.spacing(4),
  },
}));

// Sample questions for each semester
const questionsBySemester = {
  1: [
    {
      id: 'q1',
      type: 'scale',
      question: 'How would you rate the clarity and organization of the course content?',
      required: true,
    },
    {
      id: 'q2',
      type: 'scale',
      question: 'How effective are the teaching methods in helping you understand the material?',
      required: true,
    },
    {
      id: 'q3',
      type: 'scale',
      question: 'How well do the learning resources (materials, tools, etc.) support your learning?',
      required: true,
    },
    {
      id: 'q4',
      type: 'text',
      question: 'What specific topics or areas would you like to see covered in more detail?',
      required: true,
    },
    {
      id: 'q5',
      type: 'text',
      question: 'How can the instructor improve the learning experience in this course?',
      required: true,
    },
  ],
  2: [
    {
      id: 'q1',
      type: 'scale',
      question: 'How would you rate the pace of the course so far?',
      required: true,
    },
    {
      id: 'q2',
      type: 'scale',
      question: 'How effective are the teaching methods being used?',
      required: true,
    },
    {
      id: 'q3',
      type: 'text',
      question: 'What improvements would you suggest for the course content?',
      required: true,
    },
  ],
  3: [
    {
      id: 'q1',
      type: 'scale',
      question: 'Overall, how would you rate this course?',
      required: true,
    },
    {
      id: 'q2',
      type: 'scale',
      question: 'How likely are you to recommend this course to others?',
      required: true,
    },
    {
      id: 'q3',
      type: 'text',
      question: 'Please provide any additional comments or suggestions for improvement:',
      required: false,
    },
  ],
};

const scaleOptions = [
  { value: '5', label: 'Excellent' },
  { value: '4', label: 'Very Good' },
  { value: '3', label: 'Good' },
  { value: '2', label: 'Fair' },
  { value: '1', label: 'Poor' },
];

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const FeedbackForm = () => {
  const { phase } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const questions = questionsBySemester[phase] || [];
  const totalSteps = questions.length;

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: window.location.pathname } });
        return;
      }
      setLoading(false);
    };

    checkAuth();
  }, [navigate, phase]);

  const handleNext = () => {
    const currentQuestion = questions[activeStep];
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      setFormErrors(prev => ({
        ...prev,
        [currentQuestion.id]: 'This is a required question',
      }));
      return;
    }
    
    setActiveStep((prevStep) => prevStep + 1);
    setError('');
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
    
    if (formErrors[questionId]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const requiredQuestions = questions.filter(q => q.required);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id]);
    
    if (missingAnswers.length > 0) {
      const newErrors = {};
      missingAnswers.forEach(q => {
        newErrors[q.id] = 'This is a required question';
      });
      setFormErrors(newErrors);
      setActiveStep(questions.findIndex(q => missingAnswers.some(mq => mq.id === q.id)));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    setShowConfirmDialog(false);
    setSubmitLoading(true);
    setError('');
    
    try {
      console.log('Submitting feedback with data:', {
        semester: parseInt(phase),
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question: questions.find(q => q.id === questionId)?.question || questionId,
          answer: answer.toString()
        }))
      });
      
      const response = await axios.post(
        '/feedback/submit',
        {
          semester: parseInt(phase),
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            question: questions.find(q => q.id === questionId)?.question || questionId,
            answer: answer.toString()
          }))
        }
      );
      
      console.log('Feedback submission successful:', response.data);
      setSuccess(true);
      setShowSuccessDialog(true);
      setSubmitLoading(false);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
    } catch (err) {
      console.error('Error submitting feedback:', err);
      
      let errorMessage = 'Failed to submit feedback. Please try again.';
      
      if (err.response) {
        // Server responded with an error
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      errorMessage;
                      
        if (err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { state: { from: window.location.pathname } });
          return;
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderQuestion = (question) => {
    const error = formErrors[question.id];
    
    switch (question.type) {
      case 'scale':
        return (
          <FormControl component="fieldset" error={!!error} fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500, color: 'text.primary' }}>
              {question.question} {question.required && '*'}
            </FormLabel>
            <RadioGroup
              aria-label={question.id}
              name={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              sx={{ gap: 1 }}
            >
              {scaleOptions.map((option) => (
                <Box key={option.value} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                  <Radio value={option.value} />
                  <Box sx={{ ml: 1, display: 'flex', flexDirection: 'column' }}>
                    <span>{option.value} - {option.label}</span>
                  </Box>
                </Box>
              ))}
            </RadioGroup>
            {error && (
              <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                {error}
              </Typography>
            )}
          </FormControl>
        );
        
      case 'text':
        return (
          <FormControl fullWidth error={!!error}>
            <TextField
              id={question.id}
              label={`${question.question} ${question.required ? '*' : ''}`}
              variant="outlined"
              fullWidth
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              error={!!error}
              helperText={error}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </FormControl>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Root>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={4}>
          <IconButton 
            onClick={() => window.history.back()} 
            sx={{ mr: 2, color: 'primary.main' }}
            aria-label="go back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Phase {phase} Feedback - {phase === '1' ? '20%' : phase === '2' ? '50%' : '100%'} Completion
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel className={classes.stepper}>
          {questions.map((_, index) => (
            <Step key={index} completed={activeStep > index}>
              <StepLabel>Question {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Paper className={classes.paper} elevation={0}>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            )}
            
            <div className={classes.question}>
              {questions[activeStep] && renderQuestion(questions[activeStep])}
            </div>
            
            <div className={classes.buttons}>
              <Button
                variant="outlined"
                disabled={activeStep === 0 || submitLoading}
                onClick={handleBack}
                sx={{ minWidth: 100 }}
              >
                Back
              </Button>
              
              {activeStep !== totalSteps - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  sx={{ minWidth: 100 }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitLoading}
                  sx={{ minWidth: 150 }}
                  endIcon={submitLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                  {submitLoading ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              )}
            </div>
          </form>
        </Paper>
      </Container>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        aria-labelledby="success-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <Box className={classes.dialogContent}>
          <CheckCircleOutlineIcon className={classes.successIcon} />
          <Typography variant="h5" gutterBottom>
            Thank You!
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Your feedback has been submitted successfully.
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Redirecting to dashboard...
          </Typography>
        </Box>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Feedback</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your feedback? You won't be able to edit it after submission.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmSubmit} 
            color="primary" 
            variant="contained"
            autoFocus
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Root>
  );
};

export default FeedbackForm;