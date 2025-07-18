const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Middleware to check admin access
const adminAuth = (req, res, next) => {
    if (!req.user.email.includes('admin')) {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    next();
};

// Middleware for resume dashboard routes (no JWT required)
const resumeAuth = (req, res, next) => {
    // For the dedicated resumes dashboard, we bypass JWT auth
    // In a production environment, you might want to implement a separate token system
    next();
};

// @route   GET /api/admin/dashboard-stats
// @desc    Get dashboard statistics for admin
// @access  Private (Admin only)
router.get('/dashboard-stats', auth, adminAuth, async (req, res) => {
    try {
        const totalStudents = await User.countDocuments();
        const totalFeedbacks = await Feedback.countDocuments();
        
        // Count resumes uploaded
        const resumesUploaded = await Feedback.countDocuments({
            semester: 'resumeUpload',
            'responses.filePath': { $exists: true }
        });
        
        // Feedback by semester
        const feedbackBySemester = await Feedback.aggregate([
            {
                $match: { semester: { $ne: 'resumeUpload' } }
            },
            {
                $group: {
                    _id: '$semester',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Recent submissions (last 10)
        const recentSubmissions = await Feedback.find()
            .sort({ submittedAt: -1 })
            .limit(10)
            .select('studentName studentEmail semester submittedAt');

        res.json({
            totalStudents,
            totalFeedbacks,
            resumesUploaded,
            feedbackBySemester,
            recentSubmissions
        });
    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/students
// @desc    Get all students with their submission status
// @access  Private (Admin only)
router.get('/students', auth, adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const college = req.query.college || '';
        const skip = (page - 1) * limit;

        // Build search query
        let searchQuery = {};
        if (search) {
            searchQuery.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } },
                { collegeName: { $regex: search, $options: 'i' } }
            ];
        }

        // Add college filter
        if (college) {
            searchQuery.collegeName = college;
        }

        const students = await User.find(searchQuery)
            .select('-password')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments(searchQuery);

        // Get feedback counts for each student
        const studentsWithStats = await Promise.all(
            students.map(async (student) => {
                const feedbackCount = await Feedback.countDocuments({
                    studentEmail: student.email,
                    semester: { $ne: 'resumeUpload' }
                });
                
                const resumeSubmitted = await Feedback.findOne({
                    studentEmail: student.email,
                    semester: 'resumeUpload'
                });

                return {
                    ...student.toObject(),
                    feedbackCount,
                    resumeSubmitted: !!resumeSubmitted,
                    resumeFilePath: resumeSubmitted?.responses?.filePath || null
                };
            })
        );

        res.json({
            students: studentsWithStats,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/resumes
// @desc    Get all student resumes
// @access  Private (Resume Dashboard)
router.get('/resumes', resumeAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Read files directly from uploads directory
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        let resumeFiles = [];
        
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            resumeFiles = files.filter(file => 
                file.toLowerCase().endsWith('.pdf') || 
                file.toLowerCase().endsWith('.doc') || 
                file.toLowerCase().endsWith('.docx')
            );
        }

        // Try to get resume data from Feedback collection with different approach
        // Check if there are any feedback records that might contain resume info
        let feedbackResumes = [];
        try {
            // Try to find feedback records that might contain resume upload info
            feedbackResumes = await Feedback.find({
                $or: [
                    { 'responses.filePath': { $exists: true } },
                    { 'responses.fileName': { $exists: true } }
                ]
            }).select('studentName studentEmail studentRollNumber studentCollege submittedAt responses');
            console.log('Found feedback records with file info:', feedbackResumes.length);
        } catch (err) {
            console.log('Could not query feedback collection:', err.message);
        }
        
        // Get users who have uploaded resumes (have resume field populated)
        const usersWithResumes = await User.find({
            resume: { $ne: null, $ne: '' }
        }).select('fullName email rollNumber collegeName resume updatedAt');
        
        console.log('Found users with resumes:', usersWithResumes.length);
        console.log('Resume files in directory:', resumeFiles);
        
        // Create resume data from users who have uploaded resumes
        let allResumes = [];
        
        // First, add resumes from users who have the resume field populated
        for (const user of usersWithResumes) {
            const resumePath = user.resume;
            const fileName = resumePath ? resumePath.split('/').pop() : null;
            
            console.log(`User: ${user.fullName}, Resume path: ${resumePath}, File name: ${fileName}`);
            
            // Check if the file actually exists in uploads directory
            if (fileName && resumeFiles.includes(fileName)) {
                allResumes.push({
                    _id: user._id,
                    studentName: user.fullName,
                    studentEmail: user.email,
                    studentRollNumber: user.rollNumber,
                    studentCollege: user.collegeName,
                    submissionDate: user.updatedAt,
                    filePath: `uploads/${fileName}`,
                    fileName: fileName
                });
            }
        }
        
        console.log('Matched resumes from users:', allResumes.length);
        
        // Also try to match using feedback records
        const feedbackFileMap = new Map();
        feedbackResumes.forEach(feedback => {
            if (feedback.responses && feedback.responses.filePath) {
                const fileName = feedback.responses.filePath.split('/').pop();
                if (resumeFiles.includes(fileName)) {
                    feedbackFileMap.set(fileName, {
                        studentName: feedback.studentName || 'Unknown Student',
                        studentEmail: feedback.studentEmail || 'unknown@example.com',
                        studentRollNumber: feedback.studentRollNumber || 'N/A',
                        studentCollege: feedback.studentCollege || 'Unknown College',
                        submissionDate: feedback.submittedAt || new Date()
                    });
                }
            }
        });
        
        console.log('Matched resumes from feedback:', feedbackFileMap.size);
        
        // Then add any remaining files that couldn't be matched to users
        const matchedFiles = allResumes.map(resume => resume.fileName);
        const unmatchedFiles = resumeFiles.filter(file => !matchedFiles.includes(file));
        
        for (const file of unmatchedFiles) {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            
            // Check if we have feedback data for this file
            const feedbackData = feedbackFileMap.get(file);
            
            // Try to extract student info from new filename format: username_rollnumber_date.extension
            let extractedName = 'Unknown Student';
            let extractedRoll = 'N/A';
            let extractedEmail = 'unknown@example.com';
            
            if (file.includes('_')) {
                const parts = file.split('_');
                if (parts.length >= 2) {
                    // Format: username_rollnumber_date.extension
                    extractedName = parts[0].replace(/[_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
                    extractedRoll = parts[1];
                    
                    // Try to find user by roll number to get email and college
                    try {
                        const userByRoll = await User.findOne({ rollNumber: extractedRoll }).select('email collegeName fullName');
                        if (userByRoll) {
                            extractedEmail = userByRoll.email;
                            extractedName = userByRoll.fullName; // Use actual name from database
                        }
                    } catch (err) {
                        console.log('Could not find user by roll number:', extractedRoll);
                    }
                }
            }
            
            allResumes.push({
                _id: file,
                studentName: feedbackData ? feedbackData.studentName : extractedName,
                studentEmail: feedbackData ? feedbackData.studentEmail : extractedEmail,
                studentRollNumber: feedbackData ? feedbackData.studentRollNumber : extractedRoll,
                studentCollege: feedbackData ? feedbackData.studentCollege : 'Unknown College',
                submissionDate: feedbackData ? feedbackData.submissionDate : stats.mtime,
                filePath: `uploads/${file}`,
                fileName: file
            });
        }
        
        // Apply search filter
        if (search) {
            allResumes = allResumes.filter(resume => 
                resume.studentName.toLowerCase().includes(search.toLowerCase()) ||
                resume.studentEmail.toLowerCase().includes(search.toLowerCase()) ||
                resume.studentCollege.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        // Apply pagination
        const total = allResumes.length;
        const formattedResumes = allResumes.slice(skip, skip + limit);

        res.json({
            resumes: formattedResumes,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/download-resume/:studentEmail
// @desc    Download a specific student's resume
// @access  Private (Resume Dashboard)
router.get('/download-resume/:studentEmail', resumeAuth, async (req, res) => {
    try {
        const { studentEmail } = req.params;
        
        // Read files from uploads directory
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.status(404).json({ message: 'Uploads directory not found' });
        }
        
        const files = fs.readdirSync(uploadsDir);
        const resumeFiles = files.filter(file => 
            file.toLowerCase().endsWith('.pdf') || 
            file.toLowerCase().endsWith('.doc') || 
            file.toLowerCase().endsWith('.docx')
        );
        
        // Try to find a file that matches the student email
        // First, try to find the user in database to get their name
        let matchingFile = null;
        
        if (studentEmail !== 'unknown@example.com') {
            try {
                // Find user by email to get their full name
                console.log(`Looking for resume for student: ${studentEmail}`);
                const user = await User.findOne({ email: studentEmail }).select('fullName rollNumber resume');
                console.log(`Found user:`, user ? `${user.fullName} (${user.rollNumber})` : 'Not found');
                
                if (user) {
                    // Create the expected filename pattern based on our naming convention
                    const sanitizedName = user.fullName
                        .replace(/[^a-zA-Z0-9\s]/g, '')
                        .replace(/\s+/g, '_')
                        .toLowerCase();
                    
                    const rollNumber = user.rollNumber || 'no_roll';
                    
                    // Look for files that match the user's name and roll number pattern
                    console.log(`Looking for pattern: ${sanitizedName}_${rollNumber}_`);
                    console.log(`Available files: ${resumeFiles.join(', ')}`);
                    
                    matchingFile = resumeFiles.find(file => {
                        const fileName = file.toLowerCase();
                        const exactMatch = fileName.startsWith(`${sanitizedName}_${rollNumber}_`);
                        const partialMatch = fileName.includes(sanitizedName) && fileName.includes(rollNumber);
                        console.log(`Checking file: ${file} - Exact: ${exactMatch}, Partial: ${partialMatch}`);
                        return exactMatch || partialMatch;
                    });
                    
                    console.log(`Matched file: ${matchingFile || 'None'}`);
                    
                    // Also check if user has resume field pointing to this file
                    if (!matchingFile && user.resume) {
                        const resumeFileName = user.resume.split('/').pop();
                        if (resumeFiles.includes(resumeFileName)) {
                            matchingFile = resumeFileName;
                        }
                    }
                }
                
                // Fallback: try to match by email prefix if name-based matching fails
                if (!matchingFile) {
                    const emailPrefix = studentEmail.split('@')[0].toLowerCase();
                    matchingFile = resumeFiles.find(file => 
                        file.toLowerCase().includes(emailPrefix)
                    );
                }
            } catch (err) {
                console.error('Error finding user for resume download:', err);
                // Fallback to email prefix matching
                const emailPrefix = studentEmail.split('@')[0].toLowerCase();
                matchingFile = resumeFiles.find(file => 
                    file.toLowerCase().includes(emailPrefix)
                );
            }
        }
        
        // If no specific match found, don't return a random file
        // This prevents downloading wrong student's resume
        if (!matchingFile) {
            console.log(`No resume found for student: ${studentEmail}`);
            console.log(`Available files: ${resumeFiles.join(', ')}`);
        }
        
        if (!matchingFile) {
            return res.status(404).json({ message: 'Resume not found for this student' });
        }
        
        const fullPath = path.join(uploadsDir, matchingFile);
        
        // Set appropriate headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${matchingFile}"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        // Send file
        res.sendFile(fullPath);
    } catch (error) {
        console.error('Error downloading resume:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/download-resume-by-name/:studentName
// @desc    Download a resume by student name
// @access  Private (Resume Dashboard)
router.get('/download-resume-by-name/:studentName', resumeAuth, async (req, res) => {
    try {
        const { studentName } = req.params;
        console.log(`Looking for resume for student: ${studentName}`);
        
        // Read files from uploads directory
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.status(404).json({ message: 'Uploads directory not found' });
        }
        
        const files = fs.readdirSync(uploadsDir);
        const resumeFiles = files.filter(file => 
            file.toLowerCase().endsWith('.pdf') || 
            file.toLowerCase().endsWith('.doc') || 
            file.toLowerCase().endsWith('.docx')
        );
        
        console.log(`Available files: ${resumeFiles.join(', ')}`);
        
        // Create sanitized name pattern to match filename
        const sanitizedName = studentName
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_');
        
        console.log(`Looking for pattern: ${sanitizedName}`);
        
        // Find file that starts with the student's name
        const matchingFile = resumeFiles.find(file => {
            const fileName = file.toLowerCase();
            const fileStartsWithName = fileName.startsWith(sanitizedName);
            console.log(`Checking file: ${file} - Starts with name: ${fileStartsWithName}`);
            return fileStartsWithName;
        });
        
        console.log(`Matched file: ${matchingFile || 'None'}`);
        
        if (!matchingFile) {
            console.log(`No resume found for student: ${studentName}`);
            return res.status(404).json({ message: 'Resume not found for this student' });
        }
        
        const fullPath = path.join(uploadsDir, matchingFile);
        
        // Set appropriate headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${matchingFile}"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        // Send file
        res.sendFile(fullPath);
    } catch (error) {
        console.error('Error downloading resume:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/download-all-resumes
// @desc    Download all resumes as a ZIP file
// @access  Private (Resume Dashboard)
router.get('/download-all-resumes', resumeAuth, async (req, res) => {
    try {
        const archiver = require('archiver');
        
        // Read files directly from uploads directory
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        
        if (!fs.existsSync(uploadsDir)) {
            return res.status(404).json({ message: 'Uploads directory not found' });
        }
        
        const files = fs.readdirSync(uploadsDir);
        const resumeFiles = files.filter(file => 
            file.toLowerCase().endsWith('.pdf') || 
            file.toLowerCase().endsWith('.doc') || 
            file.toLowerCase().endsWith('.docx')
        );

        if (resumeFiles.length === 0) {
            return res.status(404).json({ message: 'No resumes found' });
        }

        // Set headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="all_student_resumes.zip"');

        // Create ZIP archive
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            res.status(500).json({ message: 'Error creating archive' });
        });

        archive.pipe(res);

        // Add each resume to the archive
        resumeFiles.forEach((file) => {
            const filePath = path.join(uploadsDir, file);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: file });
            }
        });

        archive.finalize();
    } catch (error) {
        console.error('Error creating ZIP archive:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/admin/college-stats
// @desc    Get college-wise resume upload statistics
// @access  Private (Admin only)
router.get('/college-stats', auth, adminAuth, async (req, res) => {
    try {
        // Get all colleges with student counts
        const collegeStats = await User.aggregate([
            {
                $group: {
                    _id: '$collegeName',
                    totalStudents: { $sum: 1 }
                }
            },
            {
                $sort: { totalStudents: -1 }
            }
        ]);

        // Get resume upload counts by college
        const resumeStats = await Feedback.aggregate([
            {
                $match: {
                    semester: 'resumeUpload',
                    'responses.filePath': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$studentCollege',
                    resumesUploaded: { $sum: 1 }
                }
            }
        ]);

        // Combine the data
        const combinedStats = collegeStats.map(college => {
            const resumeData = resumeStats.find(r => r._id === college._id);
            const resumesUploaded = resumeData ? resumeData.resumesUploaded : 0;
            const completionRate = ((resumesUploaded / college.totalStudents) * 100).toFixed(1);

            return {
                collegeName: college._id,
                totalStudents: college.totalStudents,
                resumesUploaded,
                completionRate: parseFloat(completionRate)
            };
        });

        res.json(combinedStats);
    } catch (error) {
        console.error('Error fetching college stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/admin/delete-student/:id
// @desc    Delete a student and all their data
// @access  Private (Admin only)
router.delete('/delete-student/:id', auth, adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const student = await User.findById(id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Delete all feedback submissions by this student
        await Feedback.deleteMany({ studentEmail: student.email });
        
        // Delete resume file if exists
        const resumeRecord = await Feedback.findOne({
            studentEmail: student.email,
            semester: 'resumeUpload'
        });
        
        if (resumeRecord && resumeRecord.responses.filePath) {
            const filePath = path.join(__dirname, '..', resumeRecord.responses.filePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete the student
        await User.findByIdAndDelete(id);

        res.json({ message: 'Student and all associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
