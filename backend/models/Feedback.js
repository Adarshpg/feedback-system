const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Student information stored directly in feedback for easy access
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    studentRollNumber: {
        type: String,
        required: true
    },
    studentCollege: {
        type: String,
        required: true
    },
    studentDateOfBirth: {
        type: Date,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
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
