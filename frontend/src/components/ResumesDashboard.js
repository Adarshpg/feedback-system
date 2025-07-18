import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Container,
    Typography,
    Box,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Pagination,
    Tooltip,
    IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import LogoutIcon from '@mui/icons-material/Logout';

const ResumesDashboard = () => {
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchResumes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Using the correct relative path for the API call
            const res = await axios.get(`/admin/resumes`, {
                params: {
                    page,
                    limit: 10,
                    search: searchTerm,
                }
            });
            setResumes(res.data.resumes);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            setError('Failed to fetch resumes. Ensure the backend is running and you are logged in.');
            console.error("Error fetching resumes:", err);
        }
        setLoading(false);
    }, [page, searchTerm]);

    useEffect(() => {
        // Check for auth token on component mount
        if (!localStorage.getItem('resumesAuth')) {
            navigate('/resumesdashboard/login');
        } else {
            fetchResumes();
        }
    }, [fetchResumes, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('resumesAuth');
        navigate('/resumesdashboard/login');
    };

    const handleDownload = async (studentEmail, studentName) => {
        try {
            console.log(`Downloading resume for: ${studentName}`);
            const response = await axios.get(`/admin/download-resume-by-name/${encodeURIComponent(studentName)}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `${studentName}_resume.pdf`; // Default filename
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (fileNameMatch && fileNameMatch.length === 2) {
                    fileName = fileNameMatch[1];
                }
            }
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download resume.');
        }
    };

    const handleBulkDownload = async () => {
        try {
            const response = await axios.get(`/admin/download-all-resumes`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'all_resumes.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setError('Failed to download all resumes.');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">Resumes Dashboard</Typography>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                >
                    Logout
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TextField
                        label="Search by Name, Email, or College..."
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchResumes()}
                        sx={{ flexGrow: 1, mr: 2 }}
                    />
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<DownloadIcon />}
                        onClick={handleBulkDownload}
                    >
                        Download All Resumes
                    </Button>
                </Box>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Student Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Submitted On</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resumes.map((resume) => (
                                <TableRow key={resume._id} hover>
                                    <TableCell>{resume.studentName}</TableCell>
                                    <TableCell>{resume.studentEmail}</TableCell>
                                    <TableCell>{new Date(resume.submissionDate).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Download Resume">
                                            <IconButton onClick={() => handleDownload(resume.studentEmail, resume.studentName)}>
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(e, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            )}
        </Container>
    );
};

export default ResumesDashboard;