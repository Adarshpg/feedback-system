// src/components/ResumesDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Box, Tabs, Tab, TextField, CircularProgress,
  IconButton, Tooltip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, 
  DialogActions, Chip, Grid, Avatar, Rating, AppBar, Toolbar, IconButton as MuiIconButton
} from '@mui/material';
import { Download, Search, Refresh, Visibility, Logout } from '@mui/icons-material';
import axios from 'axios';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ResumesDashboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [feedbackData, setFeedbackData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Check authentication on component mount
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('resumesAuth') === 'true';
    if (!isAuthenticated) {
      navigate('/resumesdashboard/login');
    }
    fetchFeedback();
  }, [navigate]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint
      const response = await axios.get('http://localhost:5000/api/feedback');
      setFeedbackData(response.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch feedback data',
        severity: 'error'
      });
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleCloseDetails = () => {
    setSelectedFeedback(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleLogout = () => {
    localStorage.removeItem('resumesAuth');
    navigate('/resumesdashboard/login');
  };

  const handleExportCSV = () => {
    const headers = ['Student', 'Email', 'Course', 'Phase', 'Rating', 'Comments', 'Date'];
    const csvData = filteredFeedback.map(fb => ({
      'Student': fb.studentName || 'N/A',
      'Email': fb.email || 'N/A',
      'Course': fb.course || 'N/A',
      'Phase': `Phase ${fb.phase}`,
      'Rating': fb.rating || 'N/A',
      'Comments': fb.comments || 'No comments',
      'Date': fb.date ? new Date(fb.date).toLocaleDateString() : 'N/A'
    }));

    const csvContent = [
      headers.join(','),
      ...csvData.map(item => 
        Object.values(item).map(field => 
          `"${String(field).replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `feedback-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFeedback = feedbackData.filter(feedback => 
    (feedback.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.course?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (tabValue === 0 || feedback.phase === tabValue)
  );

  return (
    <>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Resumes Dashboard
          </Typography>
          <Button
            color="inherit"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Resumes" />
            <Tab label="Feedback Management" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>Resume Management</Typography>
          <Typography>Resume management content will be displayed here.</Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <TextField
              size="small"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ width: 400 }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<Download />}
              onClick={handleExportCSV}
              sx={{ ml: 2 }}
            >
              Export Feedback
            </Button>
          </Box>

          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Phase</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Comments</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>Loading feedback data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredFeedback.length > 0 ? (
                  filteredFeedback.map((feedback) => (
                    <TableRow key={feedback._id} hover>
                      <TableCell>{feedback.studentName || 'N/A'}</TableCell>
                      <TableCell>{feedback.email || 'N/A'}</TableCell>
                      <TableCell>{feedback.course || 'N/A'}</TableCell>
                      <TableCell>Phase {feedback.phase}</TableCell>
                      <TableCell>
                        {feedback.rating ? (
                          <Box display="flex" alignItems="center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                style={{
                                  color: star <= (feedback.rating || 0) ? '#ffc107' : '#e0e0e0',
                                  fontSize: '1.2rem'
                                }}
                              >
                                ★
                              </span>
                            ))}
                          </Box>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {feedback.comments || 'No comments'}
                      </TableCell>
                      <TableCell>
                        {feedback.date ? new Date(feedback.date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handleViewDetails(feedback)}>
                            <Visibility color="primary" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1">No feedback found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <Dialog
          open={!!selectedFeedback}
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
        >
          {selectedFeedback && (
            <>
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Feedback Details</Typography>
                  <Chip 
                    label={`Phase ${selectedFeedback.phase}`} 
                    color="primary" 
                    size="small" 
                  />
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box mb={3}>
                      <Typography variant="subtitle2" color="textSecondary">STUDENT</Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {selectedFeedback.studentName?.charAt(0) || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">{selectedFeedback.studentName || 'N/A'}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {selectedFeedback.email || 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box mb={3}>
                      <Typography variant="subtitle2" color="textSecondary">COURSE</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {selectedFeedback.course || 'N/A'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">DATE SUBMITTED</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {selectedFeedback.date ? new Date(selectedFeedback.date).toLocaleString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box mb={3}>
                      <Typography variant="subtitle2" color="textSecondary">RATING</Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Rating
                          value={selectedFeedback.rating || 0}
                          readOnly
                          precision={0.5}
                          size="large"
                        />
                        <Typography variant="h6" sx={{ ml: 2 }}>
                          {selectedFeedback.rating ? `${selectedFeedback.rating} out of 5` : 'No rating'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="textSecondary">COMMENTS</Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1, minHeight: 100, bgcolor: 'background.paper' }}>
                        <Typography>
                          {selectedFeedback.comments || 'No comments provided.'}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDetails}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default ResumesDashboard;