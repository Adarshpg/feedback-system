const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255,
        unique: true
    },
    rollNumber: {
        type: String,
        required: true,
        unique: true
    },
    collegeName: {
        type: String,
        required: true
    },
    contactNo: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/
    },
    course: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
