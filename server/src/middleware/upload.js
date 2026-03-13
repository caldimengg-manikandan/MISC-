const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const logger = require('../utils/logger');

// Configure secure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user-specific upload directory
    const userDir = path.join(
      process.env.UPLOAD_DIR || 'secure_uploads',
      `user_${req.user._id}`
    );
    
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate secure filename with timestamp and hash
    const timestamp = Date.now();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const originalHash = crypto
      .createHash('md5')
      .update(file.originalname + timestamp)
      .digest('hex');
    
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.]/g, '_')
      .substring(0, 100);
    
    const filename = `${timestamp}_${originalHash}_${randomHash}_${safeName}`;
    
    cb(null, filename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Check file extension
  if (!allowedTypes.includes(ext)) {
    logger.warn('Invalid file type attempted', {
      userId: req.user._id,
      filename: file.originalname,
      fileType: file.mimetype,
      extension: ext
    });
    
    return cb(new Error('Only Excel files are allowed (.xlsx, .xls, .csv)'), false);
  }
  
  // Check MIME type
  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/octet-stream'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    logger.warn('Invalid MIME type attempted', {
      userId: req.user._id,
      filename: file.originalname,
      fileType: file.mimetype
    });
    
    return cb(new Error('Invalid file type'), false);
  }
  
  cb(null, true);
};

// Create upload instance with security limits
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 1 // Only one file at a time
  }
});

// Middleware to scan uploaded files (basic check)
const scanFile = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  
  const filePath = req.file.path;
  
  // Basic security checks
  try {
    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > parseInt(process.env.MAX_FILE_SIZE)) {
      fs.unlinkSync(filePath); // Delete oversized file
      return res.status(400).json({
        success: false,
        error: 'File too large'
      });
    }
    
    // Check for potentially dangerous content
    const fileContent = fs.readFileSync(filePath, 'utf8', { encoding: 'utf8', start: 0, end: 1000 });
    
    // Basic malware pattern detection (very basic - consider professional antivirus)
    const dangerousPatterns = [
      /<script>/i,
      /javascript:/i,
      /eval\(/i,
      /\.php$/i,
      /\.exe$/i,
      /\.dll$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.vbs$/i,
      /\.ps1$/i
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(fileContent) || pattern.test(req.file.originalname)) {
        fs.unlinkSync(filePath); // Delete dangerous file
        logger.warn('Potentially dangerous file detected and deleted', {
          userId: req.user._id,
          filename: req.file.originalname,
          pattern: pattern.toString()
        });
        
        return res.status(400).json({
          success: false,
          error: 'File contains potentially dangerous content'
        });
      }
    }
    
    next();
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    logger.error('File scanning failed', {
      error: error.message,
      userId: req.user._id,
      filename: req.file?.originalname
    });
    
    res.status(500).json({
      success: false,
      error: 'File processing failed'
    });
  }
};

module.exports = { upload, scanFile };