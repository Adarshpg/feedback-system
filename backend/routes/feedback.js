const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

// Submit feedback
router.post('/submit', auth, async (req, res) => {
    console.log('Received feedback submission:', { body: req.body, user: req.user });
    
    const { phase, answers } = req.body;
    
    // Validate required fields
    if (!phase || !answers || !Array.isArray(answers)) {
        console.error('Validation failed:', { phase, answers });
        return res.status(400).json({ 
            error: 'Invalid input',
            details: 'Phase and answers are required and answers must be an array'
        });
    }
    
    try {
        // Create new feedback
        const feedback = new Feedback({
            user: req.user._id,
            phase: parseInt(phase),
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
        const feedbacks = await Feedback.find({ user: req.user._id });
        res.json(feedbacks);
    } catch (err) {
        res.status(400).send(err);
    }
});

// Get feedback phase status
router.get('/status', auth, async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ user: req.user._id });
        const status = {
            phase1: feedbacks.some(f => f.phase === 1),
            phase2: feedbacks.some(f => f.phase === 2),
            phase3: feedbacks.some(f => f.phase === 3)
        };
        res.json(status);
    } catch (err) {
        res.status(400).send(err);
    }
});

module.exports = router;
