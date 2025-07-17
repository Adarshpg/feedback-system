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
import { Tab, Tabs } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';  

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
    padding: theme.spacing(3),
    marginTop: theme.spacing(1),
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: theme.shadows[3],
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      margin: theme.spacing(1),
      borderRadius: theme.shape.borderRadius,
    },
  },
  [`& .${classes.stepper}`]: {
    padding: theme.spacing(2, 0, 3),
    '& .MuiStepIcon-root.Mui-completed': {
      color: theme.palette.success.main,
    },
    '& .MuiStepIcon-root.Mui-active': {
      color: theme.palette.primary.main,
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1, 0, 2),
      '& .MuiStepLabel-label': {
        fontSize: '0.75rem',
      },
    },
  },
  [`& .${classes.buttons}`]: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(3),
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: theme.spacing(2),
      '& > *': {
        width: '100%',
        margin: 0,
      },
    },
  },
  [`& .${classes.question}`]: {
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2.5),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      marginBottom: theme.spacing(2),
      borderLeft: `3px solid ${theme.palette.primary.main}`,
    },
  },
  [`& .${classes.successIcon}`]: {
    fontSize: 60,
    color: theme.palette.success.main,
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      fontSize: 48,
    },
  },
  [`& .${classes.dialogContent}`]: {
    textAlign: 'center',
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
  },
}));

// Sample questions for each semester
const questionsBySemester = {
  1: [
    {
      id: 'industry',
      type: 'radio',
      question: 'Which Of The Following Categories Best Describes Your Organization\'s Primary Industry?',
      required: true,
      options: [
        { value: 'architecture', label: 'Architecture, Engineering & Construction Industry' },
        { value: 'manufacturing', label: 'Manufacturing Industry' },
        { value: 'sales', label: 'Sales & Marketing' },
        { value: 'designer', label: 'Designer' },
        { value: 'education', label: 'Education sector' },
        { value: 'electrical', label: 'Electrical Industry' }
      ]
    },
    {
      id: 'role',
      type: 'radio',
      question: 'What is your primary role in your organization?',
      required: true,
      options: [
        { value: 'entry', label: 'Entry-level Employee' },
        { value: 'mid', label: 'Mid-level Manager' },
        { value: 'senior', label: 'Senior Management' },
        { value: 'executive', label: 'Executive/C-level' },
        { value: 'founder', label: 'Founder/Entrepreneur' },
        { value: 'other_role', label: 'Other (please specify)' }
      ]
    },
    {
      id: 'q0',
      type: 'radio',
      question: 'Which of the following best describes you?',
      required: true,
      options: [
        { value: 'higher_ed', label: 'Higher Education Student (College / University)' },
        { value: 'professional', label: 'Working Professional' },
        { value: 'educator', label: 'Educator' },
        { value: 'job_seeker', label: 'Looking for a Job' }
      ]
    },
    {
      id: 'q1',
      type: 'scale',
      question: 'How would you rate the clarity and organization of the course content?',
      required: true,
    },
    {
      id: 'q2',
      type: 'scale',
      question: 'How effective are the teaching methods in helping you understand the topics?',
      required: true,
    },
    {
      id: 'q3',
      type: 'scale',
      question: 'How well do the learning resources (course, tools, etc.) support your learning?',
      required: true
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
      id: 'satisfaction_overall',
      type: 'satisfaction',
      question: 'a) Overall Experience',
      required: true
    },
    {
      id: 'satisfaction_equipment',
      type: 'satisfaction',
      question: 'b) Computer Equipment',
      required: true
    },
    {
      id: 'satisfaction_facility',
      type: 'satisfaction',
      question: 'c) Training Facility',
      required: true
    },
    {
      id: 'satisfaction_instructor',
      type: 'satisfaction',
      question: 'd) Instructor',
      required: true
    },
    {
      id: 'instructor_communication',
      type: 'scale',
      question: 'Communication from the Instructor',
      required: true,
      scaleLabels: {
        left: 'Very bad',
        right: 'Very good'
      }
    },
    {
      id: 'instructor_knowledge',
      type: 'scale',
      question: 'Software Knowledge of the Instructor',
      required: true,
      scaleLabels: {
        left: 'Very bad',
        right: 'Very good'
      }
    },
    {
      id: 'lab_support',
      type: 'scale',
      question: 'Support in Lab',
      required: true,
      scaleLabels: {
        left: 'Very bad',
        right: 'Very good'
      }
    },
    {
      id: 'continue_learning',
      type: 'scale',
      question: 'How likely or unlikely are you to continue learning this software?',
      required: true,
      scaleLabels: {
        left: 'Not at all Likely',
        right: 'Extremely Likely'
      }
    },
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
  3: [
    {
      id: 'training_purpose',
      type: 'radio',
      question: 'What Do You Intend To Use This Training For?',
      required: true,
      options: [
        { value: 'college_project', label: 'College/university project' },
        { value: 'career_enhancement', label: 'Career enhancement/better job opportunity' },
        { value: 'teach_organization', label: 'To teach others in my organization' },
        { value: 'personal_interest', label: 'Personal interest' },
        { value: 'current_job_productivity', label: 'To become more productive in my current job' },
        { value: 'teach_students', label: 'To teach students at my College/University' },
        { value: 'evaluate_product', label: 'To evaluate the product before making the purchase' }
      ]
    },
    {
      id: 'user_type',
      type: 'radio',
      question: 'Which of the following best describes you?',
      required: true,
      options: [
        { value: 'student', label: 'Student' },
        { value: 'educator', label: 'Educator/Teacher' },
        { value: 'professional', label: 'Working Professional' },
        { value: 'self_employed', label: 'Self-Employed/Entrepreneur' },
        { value: 'job_seeker', label: 'Job Seeker' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      id: 'learning_knowledge',
      type: 'likert',
      question: 'I learned new knowledge and skills',
      required: true
    },
    {
      id: 'apply_skills',
      type: 'likert',
      question: 'I will be able to apply the new skills I learned',
      required: true
    },
    {
      id: 'improve_performance',
      type: 'likert',
      question: 'The new skills I learned will improve my performance',
      required: true
    },
    {
      id: 'recommend_autodesk',
      type: 'likert',
      question: 'I\'m more likely to recommend Autodesk products as a result of this course',
      required: true
    },
    {
      id: 'recommendation_header',
      type: 'info',
      question: 'How Likely Or Unlikely Are You To Recommend The Following To A Friend Or Colleague?',
      required: false
    },
    {
      id: 'recommend_course',
      type: 'likelihood',
      question: 'a) This Course',
      required: true
    },
    {
      id: 'recommend_instructor',
      type: 'likelihood',
      question: 'b) This Instructor',
      required: true
    },
    {
      id: 'recommend_facility',
      type: 'likelihood',
      question: 'c) The Training Facility',
      required: true
    }
  ],
};

const scaleOptions = [
  { value: '5', label: 'Excellent' },
  { value: '4', label: 'Very Good' },
  { value: '3', label: 'Good' },
  { value: '2', label: 'Fair' },
  { value: '1', label: 'Poor' },
];

// Ensure API URL is defined and clean up any double slashes
const getApiUrl = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return API_URL.replace(/([^:]\/)\/+/g, '$1');
};

const renderScaleQuestion = (question, options, error, answers, handleAnswerChange) => {
  return (
    <FormControl component="fieldset" error={!!error} fullWidth sx={{ mb: { xs: 3, sm: 4 } }}>
      <FormLabel component="legend" sx={{ 
        mb: 2, 
        fontWeight: 500, 
        color: 'text.primary',
        fontSize: { xs: '0.95rem', sm: '1rem' }
      }}>
        {question.question} {question.required && '*'}
      </FormLabel>
      <RadioGroup
        row
        aria-label={question.id}
        name={question.id}
        value={answers[question.id] || ''}
        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: { xs: 0.5, sm: 1 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}
      >
        {options.map((option) => (
          <Box 
            key={option.value} 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              flex: { xs: '1 0 45%', sm: 1 },
              minWidth: { xs: '80px', sm: 'auto' },
              mb: { xs: 1, sm: 0 }
            }}
          >
            <Radio 
              value={option.value} 
              sx={{ 
                padding: { xs: '6px', sm: '9px' },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '1.2rem', sm: '1.5rem' }
                }
              }}
            />
            <Typography 
              variant="caption" 
              align="center" 
              sx={{ 
                fontSize: { xs: '0.65rem', sm: '0.7rem' }, 
                mt: -1, 
                lineHeight: '1.1',
                textAlign: 'center',
                wordBreak: 'break-word'
              }}
            >
              {option.label}
            </Typography>
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
};

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
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Ensure the API URL is properly constructed
      const apiUrl = `${getApiUrl()}/feedback/submit`.replace(/([^:]\/)\/+/g, '$1');
      console.log('API URL:', apiUrl);

      const response = await axios.post(
        apiUrl,
        {
          semester: parseInt(phase),
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            question: questions.find(q => q.id === questionId)?.question || questionId,
            answer: answer.toString()
          }))
        },
        {
          headers: {
            'x-auth-token': token,
            'Content-Type': 'application/json'
          },
          withCredentials: true
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
      
      // More detailed error logging
      if (err.response) {
        console.error('Error response data:', err.response.data);
        console.error('Error status:', err.response.status);
        console.error('Error headers:', err.response.headers);
      } else if (err.request) {
        console.error('Error request:', err.request);
      }
      
      let errorMessage = `Failed to submit feedback: ${err.message || 'Unknown error'}`;
      
      if (err.response) {
        // Only redirect to login for 401 Unauthorized
        if (err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { state: { from: window.location.pathname } });
          return;
        }
        // For other errors, show the error message
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      errorMessage;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      setSubmitLoading(false);
    }
  };

  const renderQuestion = (question) => {
    const error = formErrors[question.id];
    
    switch (question.type) {
      case 'radio':
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
              {question.options.map((option) => (
                <Box key={option.value} sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                  <Radio value={option.value} />
                  <Box sx={{ ml: 1 }}>
                    <span>{option.label}</span>
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

      case 'satisfaction':
        const satisfactionOptions = [
          { value: '5', label: 'Very Satisfied' },
          { value: '4', label: 'Satisfied' },
          { value: '3', label: 'Neutral' },
          { value: '2', label: 'Dissatisfied' },
          { value: '1', label: 'Very Dissatisfied' }
        ];
        
        return (
          <FormControl component="fieldset" error={!!error} fullWidth sx={{ mb: 4 }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500, color: 'text.primary' }}>
              {question.question} {question.required && '*'}
            </FormLabel>
            <RadioGroup
              row
              aria-label={question.id}
              name={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
            >
              {satisfactionOptions.map((option) => (
                <Box 
                  key={option.value} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    flex: 1
                  }}
                >
                  <Radio value={option.value} />
                  <Typography variant="caption" align="center" sx={{ fontSize: '0.7rem', mt: -1 }}>
                    {option.label}
                  </Typography>
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
        
      case 'likert':
        const likertOptions = [
          { value: '1', label: 'Strongly Disagree' },
          { value: '2', label: 'Disagree' },
          { value: '3', label: 'Neutral' },
          { value: '4', label: 'Agree' },
          { value: '5', label: 'Strongly Agree' }
        ];
        
        return renderScaleQuestion(question, likertOptions, error, answers, handleAnswerChange);
        
      case 'likelihood':
        const likelihoodOptions = [
          { value: '1', label: 'Not at all Likely' },
          { value: '2', label: 'A Little Likely' },
          { value: '3', label: 'Somewhat Likely' },
          { value: '4', label: 'Very Likely' },
          { value: '5', label: 'Extremely Likely' }
        ];
        
        return renderScaleQuestion(question, likelihoodOptions, error, answers, handleAnswerChange);
        
      case 'info':
        return (
          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.primary' }}>
              {question.question}
            </Typography>
          </Box>
        );
        
        return (
          <FormControl component="fieldset" error={!!error} fullWidth sx={{ mb: 4 }}>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500, color: 'text.primary' }}>
              {question.question} {question.required && '*'}
            </FormLabel>
            <RadioGroup
              row
              aria-label={question.id}
              name={question.id}
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
            >
              {likertOptions.map((option) => (
                <Box 
                  key={option.value} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    flex: 1
                  }}
                >
                  <Radio value={option.value} />
                  <Typography variant="caption" align="center" sx={{ fontSize: '0.7rem', mt: -1, lineHeight: '1.1' }}>
                    {option.label}
                  </Typography>
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
      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
        <Box display="flex" alignItems="center" mb={{ xs: 2, sm: 4 }} sx={{ flexWrap: 'wrap' }}>
          <IconButton 
            onClick={() => window.history.back()} 
            sx={{ mr: { xs: 1, sm: 2 }, color: 'primary.main', minWidth: 'auto' }}
            aria-label="go back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              color: 'primary.main',
              fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
              lineHeight: 1.2,
              flex: 1
            }}
          >
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
                sx={{ 
                  minWidth: { xs: 80, sm: 100 },
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  padding: { xs: '8px 16px', sm: '10px 20px' }
                }}
              >
                Back
              </Button>
              
              {activeStep !== totalSteps - 1 ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  sx={{ 
                    minWidth: { xs: 80, sm: 100 },
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    padding: { xs: '8px 16px', sm: '10px 20px' }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitLoading}
                  sx={{ 
                    minWidth: { xs: 120, sm: 150 },
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    padding: { xs: '8px 16px', sm: '10px 20px' }
                  }}
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