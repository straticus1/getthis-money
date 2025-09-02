const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

// Enhanced JWT service with secure token generation
class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';
    
    if (!this.secret || this.secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
  }

  generateTokens(payload) {
    const accessToken = jwt.sign(payload, this.secret, {
      expiresIn: '15m',
      algorithm: 'HS256',
      issuer: 'getthis.money',
      audience: 'getthis.money-users'
    });

    const refreshToken = jwt.sign(
      { userId: payload.id },
      this.refreshSecret,
      {
        expiresIn: '7d',
        algorithm: 'HS256',
        issuer: 'getthis.money',
        audience: 'getthis.money-users'
      }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
        issuer: 'getthis.money',
        audience: 'getthis.money-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshSecret, {
        algorithms: ['HS256'],
        issuer: 'getthis.money',
        audience: 'getthis.money-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }
}

// Secure rate limiting configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Rate limiting middleware configurations
const rateLimits = {
  general: createRateLimit(15 * 60 * 1000, 100, 'Too many requests, please try again later'),
  auth: createRateLimit(15 * 60 * 1000, 5, 'Too many authentication attempts', true),
  ideaGeneration: createRateLimit(60 * 1000, 10, 'Too many idea generation requests per minute'),
  passwordReset: createRateLimit(60 * 60 * 1000, 3, 'Too many password reset attempts per hour'),
  api: createRateLimit(15 * 60 * 1000, 1000, 'API rate limit exceeded')
};

// Enhanced security headers with CSP
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CSP nonce middleware
const cspNonce = (req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('hex');
  next();
};

// Enhanced input validation
const validationSchemas = {
  registration: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 254 })
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name is required'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores')
  ],
  
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ max: 128 })
  ],
  
  businessIdea: [
    body('preferences.state').notEmpty().isLength({ max: 50 }),
    body('preferences.industry').notEmpty().isLength({ max: 100 }),
    body('preferences.budget').isIn(['Low', 'Medium', 'High']),
    body('preferences.experience').isIn(['Beginner', 'Intermediate', 'Expert']),
    body('preferences.timeCommitment').isIn(['Part-time', 'Full-time'])
  ]
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const jwtService = new JWTService();
    const decoded = jwtService.verifyAccessToken(token);
    
    // Fetch user from database
    const User = require('../models/User');
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

// Authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Subscription check middleware
const checkSubscription = (requiredTier = 'free') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const tierLevels = { free: 0, premium: 1, enterprise: 2 };
    const userLevel = tierLevels[req.user.subscription] || 0;
    const requiredLevel = tierLevels[requiredTier] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        error: 'Subscription upgrade required',
        required: requiredTier,
        current: req.user.subscription
      });
    }

    // Check subscription expiry
    if (req.user.subscriptionExpires && new Date() > req.user.subscriptionExpires) {
      return res.status(403).json({
        error: 'Subscription expired',
        expired: req.user.subscriptionExpires
      });
    }

    next();
  };
};

// CORS configuration with security
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight for 24 hours
};

// Request sanitization
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS patterns
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  
  next();
};

module.exports = {
  JWTService,
  rateLimits,
  securityHeaders,
  cspNonce,
  validationSchemas,
  handleValidationErrors,
  authenticate,
  authorize,
  checkSubscription,
  corsOptions,
  sanitizeInput
};
