import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  styled
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  CloudDownload as CloudDownloadIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';                  
import axios from 'axios';
import ResumesDashboard from '../components/ResumesDashboard';

// Styled components for better UI
const StatsCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  '& .MuiCardContent-root': {
    padding: theme.spacing(3),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  minWidth: 'auto',
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div role="tabpanel" hidden={value !== index} {...other}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard stats
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeedbacks: 0,
    resumesUploaded: 0,
    feedbackBySemester: [],
    recentSubmissions: []
  });

  // Students data
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotalPages, setStudentsTotalPages] = useState(1);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [studentsCollegeFilter, setStudentsCollegeFilter] = useState('');

  // Resumes data
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [resumesPage, setResumesPage] = useState(1);
  const [resumesTotalPages, setResumesTotalPages] = useState(1);
  const [resumesSearch, setResumesSearch] = useState('');
  const [resumesCollegeFilter, setResumesCollegeFilter] = useState('');

  // College stats data
  const [collegeStats, setCollegeStats] = useState([]);
  const [collegeStatsLoading, setCollegeStatsLoading] = useState(false);

  // Colleges list for filters
  const [colleges, setColleges] = useState([]);

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState({ open: false, student: null });
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email?.includes('admin');

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    fetchDashboardStats();
    fetchColleges();
  }, [isAdmin]);

  useEffect(() => {
    if (tabValue === 1) fetchStudents();
    if (tabValue === 2) fetchResumes();
    if (tabValue === 3) fetchCollegeStats();
  }, [tabValue, studentsPage, studentsSearch, studentsCollegeFilter, resumesPage, resumesSearch, resumesCollegeFilter]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await axios.get('/admin/students', {
        params: {
          page: studentsPage,
          limit: 10,
          search: studentsSearch,
          college: studentsCollegeFilter
        }
      });
      setStudents(response.data.students);
      setStudentsTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students data');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      setResumesLoading(true);
      const response = await axios.get('/admin/resumes', {
        params: {
          page: resumesPage,
          limit: 10,
          search: resumesSearch,
          college: resumesCollegeFilter
        }
      });
      setResumes(response.data.resumes);
      setResumesTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      setError('Failed to fetch resumes data');
    } finally {
      setResumesLoading(false);
    }
  };

  const fetchCollegeStats = async () => {
    try {
      setCollegeStatsLoading(true);
      const response = await axios.get('/admin/college-stats');
      setCollegeStats(response.data);
    } catch (error) {
      console.error('Error fetching college stats:', error);
      setError('Failed to fetch college statistics');
    } finally {
      setCollegeStatsLoading(false);
    }
  };

  const fetchColleges = async () => {
    try {
      const response = await axios.get('/admin/colleges');
      setColleges(response.data);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setError('Failed to fetch colleges');
    }
  };

  const handleDownloadResume = async (studentEmail, fileName) => {
    try {
      const response = await axios.get(`/admin/download-resume/${encodeURIComponent(studentEmail)}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Resume downloaded successfully');
    } catch (error) {
      console.error('Error downloading resume:', error);
      setError('Failed to download resume');
    }
  };

  const handleDownloadAllResumes = async () => {
    try {
      setDownloadingAll(true);
      const response = await axios.get('/admin/download-all-resumes', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all_student_resumes.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('All resumes downloaded successfully');
    } catch (error) {
      console.error('Error downloading all resumes:', error);
      setError('Failed to download all resumes');
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await axios.delete(`/admin/delete-student/${deleteDialog.student._id}`);
      setSuccess('Student deleted successfully');
      setDeleteDialog({ open: false, student: null });
      fetchStudents();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error deleting student:', error);
      setError('Failed to delete student');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Admin Dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage students, resumes, and feedback submissions
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Students" />
          <Tab label="Resumes" />
          <Tab label="College Stats" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PeopleIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalStudents}
                    </Typography>
                    <Typography variant="body2">
                      Total Students
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssignmentIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.totalFeedbacks}
                    </Typography>
                    <Typography variant="body2">
                      Total Feedbacks
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudDownloadIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {stats.resumesUploaded}
                    </Typography>
                    <Typography variant="body2">
                      Resumes Uploaded
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatsCard>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" component="div">
                      {((stats.resumesUploaded / stats.totalStudents) * 100 || 0).toFixed(1)}%
                    </Typography>
                    <Typography variant="body2">
                      Completion Rate
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>

        {/* Recent Submissions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Submissions
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Submitted At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentSubmissions.map((submission, index) => (
                    <TableRow key={index}>
                      <TableCell>{submission.studentName}</TableCell>
                      <TableCell>{submission.studentEmail}</TableCell>
                      <TableCell>
                        <Chip 
                          label={submission.semester === 'resumeUpload' ? 'Resume' : `Semester ${submission.semester}`}
                          color={submission.semester === 'resumeUpload' ? 'secondary' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Students Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search students..."
            value={studentsSearch}
            onChange={(e) => setStudentsSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <FormControl sx={{ width: 200 }}>
            <InputLabel id="college-filter-label">College</InputLabel>
            <Select
              labelId="college-filter-label"
              value={studentsCollegeFilter}
              label="College"
              onChange={(e) => setStudentsCollegeFilter(e.target.value)}
            >
              <MenuItem value="">All Colleges</MenuItem>
              {colleges.map((college) => (
                <MenuItem key={college.collegeName} value={college.collegeName}>
                  {college.collegeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchStudents}
          >
            Refresh
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roll Number</TableCell>
                <TableCell>College</TableCell>
                <TableCell>Feedbacks</TableCell>
                <TableCell>Resume</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.fullName}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.collegeName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={student.feedbackCount}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={student.resumeSubmitted ? 'Submitted' : 'Not Submitted'}
                        color={student.resumeSubmitted ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {student.resumeSubmitted && (
                        <Tooltip title="Download Resume">
                          <ActionButton
                            size="small"
                            onClick={() => handleDownloadResume(student.email, `${student.fullName}_Resume.pdf`)}
                          >
                            <DownloadIcon />
                          </ActionButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete Student">
                        <ActionButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, student })}
                        >
                          <DeleteIcon />
                        </ActionButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {studentsTotalPages > 1 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={studentsTotalPages}
              page={studentsPage}
              onChange={(e, page) => setStudentsPage(page)}
              color="primary"
            />
          </Box>
        )}
      </TabPanel>

      {/* Resumes Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search resumes..."
            value={resumesSearch}
            onChange={(e) => setResumesSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <FormControl sx={{ width: 200 }}>
            <InputLabel id="college-filter-label">College</InputLabel>
            <Select
              labelId="college-filter-label"
              value={resumesCollegeFilter}
              label="College"
              onChange={(e) => setResumesCollegeFilter(e.target.value)}
            >
              <MenuItem value="">All Colleges</MenuItem>
              {colleges.map((college) => (
                <MenuItem key={college.collegeName} value={college.collegeName}>
                  {college.collegeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Button
              variant="contained"
              startIcon={<CloudDownloadIcon />}
              onClick={handleDownloadAllResumes}
              disabled={downloadingAll}
              sx={{ mr: 2 }}
            >
              {downloadingAll ? 'Downloading...' : 'Download All Resumes'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchResumes}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Roll Number</TableCell>
                <TableCell>College</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                resumes.map((resume) => (
                  <TableRow key={resume.id}>
                    <TableCell>{resume.studentName}</TableCell>
                    <TableCell>{resume.studentEmail}</TableCell>
                    <TableCell>{resume.studentRollNumber}</TableCell>
                    <TableCell>{resume.studentCollege}</TableCell>
                    <TableCell>
                      {new Date(resume.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Download Resume">
                        <ActionButton
                          size="small"
                          variant="contained"
                          onClick={() => handleDownloadResume(resume.studentEmail, resume.fileName)}
                        >
                          <DownloadIcon />
                        </ActionButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {resumesTotalPages > 1 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={resumesTotalPages}
              page={resumesPage}
              onChange={(e, page) => setResumesPage(page)}
              color="primary"
            />
          </Box>
        )}
      </TabPanel>

      {/* College Stats Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            College-wise Statistics
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>College Name</TableCell>
                  <TableCell>Total Students</TableCell>
                  <TableCell>Resumes Uploaded</TableCell>
                  <TableCell>Completion Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {collegeStatsLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  collegeStats.map((college, index) => (
                    <TableRow key={index}>
                      <TableCell>{college.collegeName}</TableCell>
                      <TableCell>{college.totalStudents}</TableCell>
                      <TableCell>{college.resumesUploaded}</TableCell>
                      <TableCell>
                        {((college.resumesUploaded / college.totalStudents) * 100 || 0).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, student: null })}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete student "{deleteDialog.student?.fullName}"? 
            This will permanently remove all their data including feedbacks and resume.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, student: null })}>
            Cancel
          </Button>
          <Button onClick={handleDeleteStudent} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
