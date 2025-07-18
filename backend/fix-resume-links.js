const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixResumeLinks() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        console.log('Connecting to MongoDB...');
        console.log('MongoDB URI exists:', !!mongoUri);
        
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment variables');
        }
        
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Get all files in uploads directory
        const uploadsDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadsDir);
        const resumeFiles = files.filter(file => 
            file.toLowerCase().endsWith('.pdf') || 
            file.toLowerCase().endsWith('.doc') || 
            file.toLowerCase().endsWith('.docx')
        );

        console.log('Found resume files:', resumeFiles);

        // Get all users
        const users = await User.find({}).select('fullName email rollNumber resume');
        console.log('Found users:', users.length);

        for (const file of resumeFiles) {
            console.log(`\nProcessing file: ${file}`);
            
            // Try to extract info from filename: firstname_lastname_rollnumber_date.extension
            if (file.includes('_')) {
                const parts = file.split('_');
                console.log(`File parts: ${parts.join(' | ')}`);
                
                // The roll number should be the part that looks like a roll number (contains numbers and letters)
                let rollNumber = null;
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    // Look for a part that contains both letters and numbers (typical roll number pattern)
                    if (/^[A-Za-z0-9]+$/.test(part) && /\d/.test(part) && /[A-Za-z]/.test(part)) {
                        rollNumber = part;
                        break;
                    }
                }
                
                if (rollNumber) {
                    console.log(`Looking for user with roll number: ${rollNumber}`);
                    
                    // Find user by roll number
                    const user = await User.findOne({ rollNumber: rollNumber });
                    if (user) {
                        console.log(`Found user: ${user.fullName} (${user.email})`);
                        
                        // Update user's resume field
                        const fileUrl = `/uploads/${file}`;
                        await User.findByIdAndUpdate(user._id, { resume: fileUrl });
                        console.log(`Updated ${user.fullName} with resume path: ${fileUrl}`);
                    } else {
                        console.log(`No user found with roll number: ${rollNumber}`);
                    }
                } else {
                    console.log(`Could not extract roll number from filename: ${file}`);
                }
            }
        }

        console.log('\nFixed resume links successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing resume links:', error);
        process.exit(1);
    }
}

fixResumeLinks();
