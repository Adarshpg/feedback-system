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
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Styled components using the new MUI v5 approach
const PREFIX = 'FeedbackForm';
const classes = {
  paper: `${PREFIX}-paper`,
  stepper: `${PREFIX}-stepper`,
  buttons: `${PREFIX}-buttons`,
  question: `${PREFIX}-question`,
  sectionTitle: `${PREFIX}-sectionTitle`,
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.paper}`]: {
    padding: theme.spacing(4),
    marginTop: theme.spacing(2),
  },
  [`& .${classes.stepper}`]: {
    padding: theme.spacing(3, 0, 5),
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(3),
    '& > *': {
      marginLeft: theme.spacing(1),
    },
  },
  [`& .${classes.question}`]: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.background.default,
  },
  [`& .${classes.sectionTitle}`]: {
    margin: theme.spacing(3, 0, 2),
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
}));

// Sample questions for each phase
const questionsByPhase = {
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

const FeedbackForm = () => {
  const { phase } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [answers, setAnswers] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const questions = questionsByPhase[phase] || [];
  const totalSteps = questions.length;

  useEffect(() => {
    // In a real app, you might want to check if the user has already submitted feedback for this phase
    // and load their previous answers if they want to edit
  }, [phase]);

  const handleNext = () => {
    // Validate current step before proceeding
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
    
    // Clear error when user provides an answer
    if (formErrors[questionId]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    
    // Check if all required questions are answered
    const requiredQuestions = questions.filter(q => q.required);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id]);
    
    if (missingAnswers.length > 0) {
      const newErrors = {};
      missingAnswers.forEach(q => {
        newErrors[q.id] = 'This is a required question';
      });
      setFormErrors(newErrors);
      setSubmitLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.post('http://localhost:5000/api/feedback/submit', 
        {
          phase: parseInt(phase),
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            question: questions.find(q => q.id === questionId)?.question || '',
            answer: answer
          }))
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );
      
      if (response.data) {
        setSuccess('Feedback submitted successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError('Failed to submit feedback. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
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
            <FormLabel component="legend">{question.question} {question.required && '*'}</FormLabel>
            <RadioGroup
              row
              aria-label={question.id}
              name={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              {scaleOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio color="primary" />}
                  label={`${option.value} - ${option.label}`}
                  labelPlacement="bottom"
                />
              ))}
            </RadioGroup>
            {error && <Typography color="error" variant="caption">{error}</Typography>}
          </FormControl>
        );
        
      case 'text':
        return (
          <FormControl fullWidth error={!!error}>
            <TextField
              id={question.id}
              label={`${question.question} ${question.required ? '*' : ''}`}
              multiline
              rows={4}
              variant="outlined"
              fullWidth
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              error={!!error}
              helperText={error}
            />
          </FormControl>
        );
        
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Root>
      <Container maxWidth="md">
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/')} style={{ marginRight: '8px' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Phase {phase} Feedback - {phase === '1' ? '20%' : phase === '2' ? '50%' : '100%'} Completion
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} className={classes.stepper}>
        {questions.map((question, index) => (
          <Step key={index}>
            <StepLabel>Question {index + 1}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Paper className={classes.paper} elevation={3}>
        <form onSubmit={handleSubmit}>
          {error && (
            <Box mb={3}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
          
          {success ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h5" color="primary" gutterBottom>
                {success}
              </Typography>
              <Typography color="textSecondary">
                Redirecting to dashboard...
              </Typography>
            </Box>
          ) : (
            <>
              <div className={classes.question}>
                {renderQuestion(questions[activeStep])}
              </div>
              
              <div className={classes.buttons}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  style={{ marginRight: 'auto' }}
                >
                  Back
                </Button>
                
                {activeStep !== totalSteps - 1 ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={submitLoading}
                  >
                    {submitLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Submit Feedback'
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </form>
      </Paper>
      </Container>
    </Root>
  );
};

export default FeedbackForm;
