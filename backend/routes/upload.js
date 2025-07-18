const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const extname = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Upload resume endpoint with custom storage for authenticated users
router.post('/upload-resume', auth, async (req, res) => {
  try {
    // Get user information
    const user = await User.findById(req.user.id).select('fullName email rollNumber');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Create custom storage for this specific upload
    const customStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Create clean filename with user's name
        const sanitizedName = user.fullName
          .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters but keep spaces
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .toLowerCase(); // Convert to lowercase for consistency
        
        const rollNumber = user.rollNumber || 'no_roll';
        const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
        const extension = path.extname(file.originalname);
        
        // Format: username_rollnumber_date.extension
        const filename = `${sanitizedName}_${rollNumber}_${timestamp}${extension}`;
        cb(null, filename);
      }
    });

    const customUpload = multer({ 
      storage: customStorage,
      fileFilter: fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }
    });

    // Use custom upload middleware
    customUpload.single('resume')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'Error uploading file' 
        });
      }

      if (!req.file) {
        console.log('No file uploaded or invalid file type');
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded or invalid file type' 
        });
      }
      
      console.log('File uploaded successfully:', req.file.filename);
      console.log('User ID:', req.user.id);

      // Update user record with resume path
      const fileUrl = `/uploads/${req.file.filename}`;
      console.log(`Updating user ${req.user.id} with resume path: ${fileUrl}`);
      
      const updatedUser = await User.findByIdAndUpdate(req.user.id, { 
        resume: fileUrl 
      }, { new: true });
      
      console.log(`User updated successfully. Resume field: ${updatedUser.resume}`);
      console.log(`File saved as: ${req.file.filename}`);
      console.log(`User: ${updatedUser.fullName} (${updatedUser.email})`);
      console.log(`Roll Number: ${updatedUser.rollNumber}`);

      res.status(200).json({ 
        success: true, 
        filePath: fileUrl,
        fileName: req.file.originalname
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error uploading file' 
    });
  }
});

// Get uploaded file
router.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ 
      success: false, 
      message: 'File not found' 
    });
  }
});

module.exports = router;