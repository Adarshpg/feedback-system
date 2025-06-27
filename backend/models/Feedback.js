const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    phase: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    answers: [{
        question: String,
        answer: mongoose.Schema.Types.Mixed
    }],
    submissionDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
