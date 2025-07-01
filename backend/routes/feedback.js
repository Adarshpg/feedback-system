const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
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

        // Save feedback
        const feedback = new Feedback({
            user: req.user._id,
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
// @desc    Get feedback status for each semester
// @access  Private
router.get('/status', auth, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id });
        const submittedSemesters = feedbacks.map(f => f.semester);

        const status = {};
        for (let i = 1; i <= 8; i++) {
            status[`semester${i}`] = submittedSemesters.includes(i);
        }

        res.json(status);
    } catch (err) {
        console.error('❌ Error fetching feedback status:', err);
        res.status(500).json({
            error: 'Server error',
            details: err.message,
        });
    }
});

module.exports = router;
