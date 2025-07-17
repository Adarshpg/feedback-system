const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST /api/feedback/submit
// @desc    Submit feedback for a semester
// @access  Private
router.post('/submit', auth, async (req, res) => {
    const { semester, answers } = req.body;

    console.log('📥 Feedback submission received:', {
        user: req.user._id,
        semester,
        answers,
    });

    // Basic validation
    if (!semester || !answers || !Array.isArray(answers)) {
        return res.status(400).json({
            error: 'Invalid input',
            details: 'Semester and answers are required and answers must be an array',
        });
    }

    if (semester < 1 || semester > 8) {
        return res.status(400).json({
            error: 'Invalid semester',
            details: 'Semester must be between 1 and 8',
        });
    }

    try {
        // Check for existing feedback
        const existingFeedback = await Feedback.findOne({
            user: req.user._id,
            semester,
        });

        if (existingFeedback) {
            return res.status(400).json({
                error: 'Feedback already submitted',
                details: 'You have already submitted feedback for this semester',
            });
        }

        // Check previous semester completion
        if (semester > 1) {
            const previousFeedback = await Feedback.findOne({
                user: req.user._id,
                semester: semester - 1,
            });

            if (!previousFeedback) {
                return res.status(400).json({
                    error: 'Previous semester not completed',
                    details: `Submit feedback for semester ${semester - 1} first`,
                });
            }
        }

        // Save feedback with student information
        const feedback = new Feedback({
            user: req.user._id,
            studentName: req.user.fullName,
            studentEmail: req.user.email,
            studentRollNumber: req.user.rollNumber,
            studentCollege: req.user.collegeName,
            studentDateOfBirth: req.user.dateOfBirth,
            semester,
            answers: answers.map(({ question, answer }) => ({
                question: question || '',
                answer,
            })),
        });

        const saved = await feedback.save();

        console.log('✅ Feedback saved:', saved._id);

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: saved._id,
        });
    } catch (err) {
        console.error('❌ Error submitting feedback:', err);
        res.status(500).json({
            error: 'Server error',
            details: err.message,
        });
    }
});

// @route   GET /api/feedback/user-feedbacks
// @desc    Get all feedbacks submitted by user
// @access  Private
router.get('/user-feedbacks', auth, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id }).sort({ semester: 1 });
        res.json(feedbacks);
    } catch (err) {
        console.error('❌ Error fetching user feedbacks:', err);
        res.status(500).json({
            error: 'Server error',
            details: err.message,
        });
    }
});

// @route   GET /api/feedback/status
// @desc    Get feedback status and progress
// @access  Private
router.get('/status', auth, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id });
        const submittedSemesters = feedbacks.map(f => f.semester);

        // Calculate progress percentage based on number of feedbacks submitted
        // 1 feedback: 20% (up to first milestone)
        // 2 feedbacks: 50% (up to second milestone)
        // 3 feedbacks: 100% (completed)
        let progress = 0;
        if (submittedSemesters.length >= 3) {
            progress = 100;  // All feedbacks completed
        } else if (submittedSemesters.length === 2) {
            progress = 50;   // Up to 50% after second feedback
        } else if (submittedSemesters.length === 1) {
            progress = 20;   // Up to 20% after first feedback
        }

        res.json({
            progress,
            submittedSemesters,
            nextFeedback: submittedSemesters.length < 3 ? submittedSemesters.length + 1 : null
        });
    } catch (err) {
        console.error('❌ Error fetching feedback status:', err);
        res.status(500).json({
            error: 'Server error',
            details: err.message,
        });
    }
});

// @route   GET /api/feedback/export-csv
// @desc    Export all feedbacks as CSV with student names
// @access  Private (Admin only - you may want to add admin middleware)
router.get('/export-csv', auth, async (req, res) => {
    try {
        // Get all feedbacks (student info now stored directly in feedback)
        const feedbacks = await Feedback.find({})
            .sort({ submissionDate: -1 });

        if (feedbacks.length === 0) {
            return res.status(404).json({
                error: 'No feedbacks found',
                details: 'No feedback data available for export'
            });
        }

        // Create CSV header
        let csvContent = 'Student Name,Email,Roll Number,College,Date of Birth,Semester,Submission Date';
        
        // Add question headers dynamically based on first feedback
        if (feedbacks.length > 0 && feedbacks[0].answers.length > 0) {
            feedbacks[0].answers.forEach((answer, index) => {
                csvContent += `,Question ${index + 1}`;
            });
        }
        csvContent += '\n';

        // Add data rows
        feedbacks.forEach(feedback => {
            const row = [
                feedback.studentName || 'Unknown User',
                feedback.studentEmail || 'N/A',
                feedback.studentRollNumber || 'N/A',
                feedback.studentCollege || 'N/A',
                feedback.studentDateOfBirth ? new Date(feedback.studentDateOfBirth).toLocaleDateString('en-US') : 'N/A',
                feedback.semester,
                new Date(feedback.submissionDate).toLocaleDateString('en-US')
            ];

            // Add answers
            feedback.answers.forEach(answer => {
                // Clean answer text for CSV (remove commas and newlines)
                let cleanAnswer = '';
                if (typeof answer.answer === 'string') {
                    cleanAnswer = answer.answer.replace(/,/g, ';').replace(/\n/g, ' ').replace(/\r/g, '');
                } else if (typeof answer.answer === 'object') {
                    cleanAnswer = JSON.stringify(answer.answer).replace(/,/g, ';');
                } else {
                    cleanAnswer = String(answer.answer || '');
                }
                row.push(`"${cleanAnswer}"`);
            });

            csvContent += row.join(',') + '\n';
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="feedback-export-${new Date().toISOString().split('T')[0]}.csv"`);
        
        res.send(csvContent);

    } catch (err) {
        console.error('❌ Error exporting CSV:', err);
        res.status(500).json({
            error: 'Server error',
            details: err.message,
        });
    }
});

// @route   GET /api/feedback/export-csv/:semester
// @desc    Export feedbacks for specific semester as CSV with student names
// @access  Private (Admin only - you may want to add admin middleware)
router.get('/export-csv/:semester', auth, async (req, res) => {
    try {
        const semester = parseInt(req.params.semester);
        
        if (semester < 1 || semester > 8) {
            return res.status(400).json({
                error: 'Invalid semester',
                details: 'Semester must be between 1 and 8'
            });
        }

        // Get feedbacks for specific semester (student info now stored directly in feedback)
        const feedbacks = await Feedback.find({ semester })
            .sort({ submissionDate: -1 });

        if (feedbacks.length === 0) {
            return res.status(404).json({
                error: 'No feedbacks found',
                details: `No feedback data available for semester ${semester}`
            });
        }

        // Create CSV header
        let csvContent = 'Student Name,Email,Roll Number,College,Date of Birth,Semester,Submission Date';
        
        // Add question headers dynamically
        if (feedbacks.length > 0 && feedbacks[0].answers.length > 0) {
            feedbacks[0].answers.forEach((answer, index) => {
                csvContent += `,Question ${index + 1}`;
            });
        }
        csvContent += '\n';

        // Add data rows
        feedbacks.forEach(feedback => {
            const row = [
                feedback.studentName || 'Unknown User',
                feedback.studentEmail || 'N/A',
                feedback.studentRollNumber || 'N/A',
                feedback.studentCollege || 'N/A',
                feedback.studentDateOfBirth ? new Date(feedback.studentDateOfBirth).toLocaleDateString('en-US') : 'N/A',
                feedback.semester,
                new Date(feedback.submissionDate).toLocaleDateString('en-US')
            ];

            // Add answers
            feedback.answers.forEach(answer => {
                // Clean answer text for CSV
                let cleanAnswer = '';
                if (typeof answer.answer === 'string') {
                    cleanAnswer = answer.answer.replace(/,/g, ';').replace(/\n/g, ' ').replace(/\r/g, '');
                } else if (typeof answer.answer === 'object') {
                    cleanAnswer = JSON.stringify(answer.answer).replace(/,/g, ';');
                } else {
                    cleanAnswer = String(answer.answer || '');
                }
                row.push(`"${cleanAnswer}"`);
            });

            csvContent += row.join(',') + '\n';
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="feedback-semester-${semester}-export-${new Date().toISOString().split('T')[0]}.csv"`);
        
        res.send(csvContent);

    } catch (err) {
        console.error('❌ Error exporting CSV:', err);
        res.status(500).json({
            error: 'Server error',
            details: err.message,
        });
    }
});

module.exports = router;
