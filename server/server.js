require('dotenv').config();

// Move handlers to top for earliest possible error catching
process.on('uncaughtException', (error) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Import configurations
const logger = require('./src/utils/logger');
const { initCron } = require('./src/utils/cron');

// Import routes

const projectRoutes = require('./src/routes/projects');
const estimationsRoutes = require('./src/routes/estimations');
const dictionaryRoutes = require('./src/routes/dictionary');

// Import secure routes
const priceRoutes = require('./src/routes/priceRoutes');
const excelRoutes = require('./src/routes/excelRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
// Import auth routes ✅
const authRoutes = require('./src/routes/authRoutes');

// Import debug routes
const debugRoutes = require('./src/routes/debug');
// Remove duplicate import: const excelDebugRoutes = require('./src/routes/excelDebugRoutes');

// Import authentication middleware
const authMiddleware = require('./src/middleware/auth');

// Create necessary directories
const createDirectories = () => {
  const directories = [
    path.join(__dirname, 'secure_uploads'),
    path.join(__dirname, 'logs'),
    path.join(__dirname, 'templates'),
    path.join(__dirname, 'backups'),
    path.join(__dirname, 'uploads') // Add this for static file serving
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

// Create directories on startup
createDirectories();

// Initialize System Configurations
const configManager = require('./src/utils/configManager');
configManager.loadConfigs();

// Initialize Cron Jobs
initCron();

const app = express();

// ================ SECURITY MIDDLEWARE ================

// Enhanced Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000'],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173' // Vite dev server
    ];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Auth-Token',
    'X-API-Key'
  ],
  exposedHeaders: ['Content-Disposition', 'X-Total-Count'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Preflight requests
app.options('*', cors(corsOptions));

// Security middlewares
app.use(xss());
app.use(hpp());

// ================ REQUEST HANDLING ================

// Rate limiting - different limits for different routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for development to prevent blocking (Original: 100)
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip; // Use IP address as key
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: 900 // seconds
    });
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Increased for development (Original: 20)
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Body parsing with enhanced limits and validation
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 100 // Limit number of parameters
}));

// Request logging with custom format
morgan.token('user-id', (req) => {
  return req.user ? req.user.id || 'anonymous' : 'anonymous';
});

morgan.token('request-id', () => {
  return crypto.randomBytes(8).toString('hex');
});

app.use(morgan(
  ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms - :request-id',
  {
    stream: {
      write: (message) => logger.info(message.trim())
    },
    skip: (req) => req.path === '/api/health' // Skip health checks
  }
));

// ================ STATIC FILES & UPLOADS ================

// Serve secure uploads with additional security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set security headers for uploaded files
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');

    // Only allow viewing, not downloading for certain file types
    const ext = path.extname(filePath).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      res.setHeader('Content-Disposition', 'inline');
    }
  }
}));

// Serve templates
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Database connection logic removed since MySQL pool is lazy-loaded or initialized in scripts

const calculationRoutes = require('./src/routes/calculationRoutes');
// ================ ROUTES ================
app.use('/api/calculate', calculationRoutes);
app.use('/api/mysql', calculationRoutes); // Alias for backward compatibility

// Health check (public) with detailed info
app.get('/api/health', (req, res) => {
  const healthcheck = {
    status: 'secure',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    node: process.version,
    platform: process.platform,
    arch: process.arch
  };

  res.json(healthcheck);
});

// API documentation (public)
app.get('/api/docs', (req, res) => {
  res.json({
    message: 'Steel Estimation API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      prices: '/api/secure/prices',
      excel: '/api/secure/excel',
      debug: '/api/debug',
      admin: '/api/admin'
    },
    documentation: 'https://docs.steel-estimation.com'
  });
});

// Public routes


// Protected routes with authentication
app.use('/api/auth', authRoutes);
app.use('/api/projects', authMiddleware, projectRoutes);
app.use('/api/estimations', authMiddleware, estimationsRoutes);
app.use('/api/dictionary', dictionaryRoutes);
app.use('/api/debug', authMiddleware, debugRoutes);

// Secure routes
app.use('/api/secure/prices', authMiddleware, priceRoutes);
app.use('/api/secure/excel', authMiddleware, excelRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// IMPORTANT: Make sure you have this route for flight geometry
// This should already be in your projectRoutes file

// ================ ERROR HANDLING ================

// 404 handler with detailed logging
app.use('*', (req, res) => {
  const requestId = crypto.randomBytes(16).toString('hex');

  logger.warn(`Route not found: ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    method: req.method,
    userAgent: req.get('User-Agent'),
    referrer: req.get('Referer'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestId,
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check the API documentation at /api/docs'
  });
});

// Global error handler with detailed logging
app.use((err, req, res, next) => {
  const requestId = crypto.randomBytes(16).toString('hex');
  const errorId = crypto.randomBytes(8).toString('hex');

  // Log error with context
  logger.error('Server Error:', {
    requestId,
    errorId,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous',
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Determine status code
  let statusCode = err.status || 500;

  // Map common error types to status codes
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'UnauthorizedError') statusCode = 401;
  if (err.name === 'ForbiddenError') statusCode = 403;
  if (err.name === 'NotFoundError') statusCode = 404;
  if (err.name === 'ConflictError') statusCode = 409;

  // Error response
  const errorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    errorId,
    requestId,
    timestamp: new Date().toISOString()
  };

  // Add additional info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.type = err.name;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
});

// ================ GRACEFUL SHUTDOWN ================

const gracefulShutdown = () => {
  logger.info('Received shutdown signal, starting graceful shutdown...');

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');

    // Close database connections here if needed
    // mongoose.connection.close();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to exit here
  // process.exit(1);
});

// ================ START SERVER ================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  const { address, port } = server.address();
  const actualPort = typeof port === 'string' ? port : port.toString();

  logger.info(`
  🔒 STEEL ESTIMATION SECURE SERVER
  =================================
  Server: http://localhost:${actualPort}
  Environment: ${process.env.NODE_ENV || 'development'}
  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
  Time: ${new Date().toISOString()}
  
  📊 SECURITY FEATURES ENABLED:
    ✅ Helmet (Enhanced Security Headers)
    ✅ CORS (Restricted Origins)
    ✅ XSS Protection
    ✅ HPP Protection
    ✅ Request Validation
    ✅ Secure Error Handling
    ✅ File Upload Security
    ✅ Graceful Shutdown
  
  📁 DIRECTORIES CREATED:
    • secure_uploads/ - Protected file storage
    • logs/ - Application logs
    • templates/ - File templates
    • backups/ - Data backups
    • uploads/ - Static file serving
  
  🔗 AVAILABLE ROUTES:
    • /api/health - Health check
    • /api/docs - API documentation
    • /api/auth - Authentication
    • /api/projects - Project management
    • /api/secure/prices - Price management
    • /api/secure/excel - Excel operations
    • /api/debug - Debug endpoints
    • /api/admin - Admin functions
  
  📈 MONITORING:
    • Request logging enabled
    • Error tracking enabled
    • Rate limiting active
    • CORS policies applied
  
  =================================
  🚀 Server running securely on port ${actualPort}
  =================================
  `);
});

// Export for testing 
module.exports = app;