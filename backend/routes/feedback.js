const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

// Submit feedback
router.post('/submit', auth, async (req, res) => {
    console.log('Received feedback submission:', { body: req.body, user: req.user });
    
    const { semester, answers } = req.body;
    
    // Validate required fields
    if (!semester || !answers || !Array.isArray(answers)) {
        console.error('Validation failed:', { semester, answers });
        return res.status(400).json({ 
            error: 'Invalid input',
            details: 'Semester and answers are required and answers must be an array'
        });
    }
    
    // Validate semester is between 1 and 8
    if (semester < 1 || semester > 8) {
        return res.status(400).json({
            error: 'Invalid semester',
            details: 'Semester must be between 1 and 8'
        });
    }
    
    try {
        // Check if feedback already exists for this semester
        const existingFeedback = await Feedback.findOne({
            user: req.user._id,
            semester: parseInt(semester)
        });
        
        if (existingFeedback) {
            return res.status(400).json({
                error: 'Feedback already submitted',
                details: 'You have already submitted feedback for this semester'
            });
        }
        
        // Check if previous semester feedback is submitted (if not first semester)
        if (semester > 1) {
            const prevSemesterFeedback = await Feedback.findOne({
                user: req.user._id,
                semester: parseInt(semester) - 1
            });
            
            if (!prevSemesterFeedback) {
                return res.status(400).json({
                    error: 'Previous semester not completed',
                    details: `Please submit feedback for semester ${semester - 1} first`
                });
            }
        }
        
        // Create new feedback
        const feedback = new Feedback({
            user: req.user._id,
            semester: parseInt(semester),
            answers: answers.map(a => ({
                question: a.question || '',
                answer: a.answer
            }))
        });

        console.log('Saving feedback:', feedback);
        const savedFeedback = await feedback.save();
        console.log('Feedback saved successfully:', savedFeedback._id);
        
        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            feedbackId: savedFeedback._id
        });
    } catch (err) {
        console.error('Error saving feedback:', err);
        res.status(500).json({ 
            error: 'Failed to save feedback',
            details: err.message 
        });
    }
});

// Get user's feedbacks
router.get('/user-feedbacks', auth, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id }).sort({ semester: 1 });
        res.json(feedbacks);
    } catch (err) {
        console.error('Error fetching feedbacks:', err);
        res.status(500).json({ 
            error: 'Failed to fetch feedbacks',
            details: err.message 
        });
    }
});

// Get feedback status for all semesters
router.get('/status', auth, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id });
        const status = {
            semester1: feedbacks.some(f => f.semester === 1),
            semester2: feedbacks.some(f => f.semester === 2),
            semester3: feedbacks.some(f => f.semester === 3),
            semester4: feedbacks.some(f => f.semester === 4),
            semester5: feedbacks.some(f => f.semester === 5),
            semester6: feedbacks.some(f => f.semester === 6),
            semester7: feedbacks.some(f => f.semester === 7),
            semester8: feedbacks.some(f => f.semester === 8)
        };
        res.json(status);
    } catch (err) {
        console.error('Error fetching feedback status:', err);
        res.status(500).json({ 
            error: 'Failed to fetch feedback status',
            details: err.message 
        });
    }
});

module.exports = router;
