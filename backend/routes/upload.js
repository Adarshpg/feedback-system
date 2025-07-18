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
        // Create meaningful filename with student info
        const sanitizedName = user.fullName.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedEmail = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const filename = `${sanitizedName}_${sanitizedEmail}_${user.rollNumber}_${timestamp}${extension}`;
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
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded or invalid file type' 
        });
      }

      // Update user record with resume path
      const fileUrl = `/uploads/${req.file.filename}`;
      await User.findByIdAndUpdate(req.user.id, { 
        resume: fileUrl 
      });

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