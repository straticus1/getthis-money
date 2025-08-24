const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const BusinessIdea = require('../models/BusinessIdea');
const { generateBusinessIdea } = require('../services/aiGenerator');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate new business idea
router.post('/generate', authenticateToken, [
  body('state').notEmpty(),
  body('industry').notEmpty(),
  body('budget').isIn(['Low', 'Medium', 'High']),
  body('experience').isIn(['Beginner', 'Intermediate', 'Expert']),
  body('timeCommitment').isIn(['Part-time', 'Full-time'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user can generate more ideas
    if (!req.user.canGenerateIdeas()) {
      return res.status(403).json({ 
        error: 'Idea generation limit reached',
        message: 'Upgrade your subscription to generate more ideas'
      });
    }

    const { state, industry, budget, experience, timeCommitment } = req.body;

    // Generate business idea using AI
    const ideaData = generateBusinessIdea({
      state,
      industry,
      budget,
      experience,
      timeCommitment
    });

    // Create business idea in database
    const businessIdea = new BusinessIdea({
      userId: req.user._id,
      ...ideaData,
      userPreferences: {
        state,
        industry,
        budget,
        experience,
        timeCommitment
      }
    });

    await businessIdea.save();

    // Increment user's idea count
    await req.user.incrementIdeasGenerated();

    res.status(201).json({
      message: 'Business idea generated successfully',
      idea: businessIdea.toJSON()
    });
  } catch (error) {
    console.error('Generate idea error:', error);
    res.status(500).json({ error: 'Failed to generate business idea' });
  }
});

// Get all business ideas (with pagination and filters)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      industry, 
      state, 
      status,
      isPublic = true 
    } = req.query;
    
    // Validate and sanitize inputs to prevent memory attacks
    const validatedPage = Math.max(1, Math.min(parseInt(page) || 1, 1000)); // Max 1000 pages
    const validatedLimit = Math.max(1, Math.min(parseInt(limit) || 10, 100)); // Max 100 items per page
    const skip = (validatedPage - 1) * validatedLimit;
    
    const query = {};

    // Apply filters with sanitization
    if (industry && typeof industry === 'string' && industry.length <= 100) {
      query.industry = industry;
    }
    if (state && typeof state === 'string' && state.length <= 50) {
      query.state = state;
    }
    if (status && typeof status === 'string' && status.length <= 20) {
      query.status = status;
    }
    if (isPublic === 'true') query.isPublic = true;

    const ideas = await BusinessIdea.find(query)
      .populate('userId', 'firstName lastName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validatedLimit)
      .lean(); // Use lean() to prevent memory leaks from Mongoose documents

    const total = await BusinessIdea.countDocuments(query);

    res.json({
      ideas,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total,
        pages: Math.ceil(total / validatedLimit)
      }
    });
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ error: 'Failed to get ideas' });
  }
});

// Get specific business idea
router.get('/:id', async (req, res) => {
  try {
    const idea = await BusinessIdea.findById(req.params.id)
      .populate('userId', 'firstName lastName username avatar');

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Increment view count
    await idea.incrementViewCount();

    res.json({ idea: idea.toJSON() });
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({ error: 'Failed to get idea' });
  }
});

// Save business idea
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    const idea = await BusinessIdea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Check if user owns the idea or has permission to save
    if (idea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to save this idea' });
    }

    await idea.saveIdea();
    await req.user.saveIdea();

    res.json({ 
      message: 'Idea saved successfully',
      idea: idea.toJSON()
    });
  } catch (error) {
    console.error('Save idea error:', error);
    res.status(500).json({ error: 'Failed to save idea' });
  }
});

// Update business idea
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim().isLength({ min: 1 }),
  body('notes').optional().trim().isLength({ max: 2000 }),
  body('tags').optional().isArray(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('feedback').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const idea = await BusinessIdea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Check if user owns the idea
    if (idea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this idea' });
    }

    const { title, description, notes, tags, rating, feedback } = req.body;

    // Update fields
    if (title) idea.title = title;
    if (description) idea.description = description;
    if (notes !== undefined) idea.notes = notes;
    if (tags) idea.tags = tags;
    if (rating) idea.rating = rating;
    if (feedback !== undefined) idea.feedback = feedback;

    await idea.save();

    res.json({ 
      message: 'Idea updated successfully',
      idea: idea.toJSON()
    });
  } catch (error) {
    console.error('Update idea error:', error);
    res.status(500).json({ error: 'Failed to update idea' });
  }
});

// Share business idea
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { userId, permission = 'view' } = req.body;

    const idea = await BusinessIdea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Check if user owns the idea
    if (idea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to share this idea' });
    }

    await idea.shareWithUser(userId, permission);
    await idea.incrementShareCount();

    res.json({ 
      message: 'Idea shared successfully',
      idea: idea.toJSON()
    });
  } catch (error) {
    console.error('Share idea error:', error);
    res.status(500).json({ error: 'Failed to share idea' });
  }
});

// Export business idea
router.post('/:id/export', authenticateToken, async (req, res) => {
  try {
    const idea = await BusinessIdea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Check if user owns the idea or has permission
    if (idea.userId.toString() !== req.user._id.toString()) {
      const hasPermission = idea.sharedWith.some(share => 
        share.userId.toString() === req.user._id.toString()
      );
      if (!hasPermission) {
        return res.status(403).json({ error: 'Not authorized to export this idea' });
      }
    }

    await idea.incrementExportCount();

    // TODO: Generate export (PDF, etc.)
    const exportData = {
      ...idea.toJSON(),
      exportedAt: new Date(),
      exportedBy: req.user._id
    };

    res.json({ 
      message: 'Idea exported successfully',
      exportData
    });
  } catch (error) {
    console.error('Export idea error:', error);
    res.status(500).json({ error: 'Failed to export idea' });
  }
});

// Archive business idea
router.post('/:id/archive', authenticateToken, async (req, res) => {
  try {
    const idea = await BusinessIdea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Check if user owns the idea
    if (idea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to archive this idea' });
    }

    await idea.archiveIdea();

    res.json({ 
      message: 'Idea archived successfully',
      idea: idea.toJSON()
    });
  } catch (error) {
    console.error('Archive idea error:', error);
    res.status(500).json({ error: 'Failed to archive idea' });
  }
});

// Mark idea as implemented
router.post('/:id/implement', authenticateToken, async (req, res) => {
  try {
    const idea = await BusinessIdea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Check if user owns the idea
    if (idea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to mark this idea as implemented' });
    }

    await idea.markAsImplemented();

    res.json({ 
      message: 'Idea marked as implemented',
      idea: idea.toJSON()
    });
  } catch (error) {
    console.error('Mark implemented error:', error);
    res.status(500).json({ error: 'Failed to mark idea as implemented' });
  }
});

// Delete business idea
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const idea = await BusinessIdea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ error: 'Business idea not found' });
    }

    // Check if user owns the idea
    if (idea.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this idea' });
    }

    await BusinessIdea.findByIdAndDelete(req.params.id);

    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ error: 'Failed to delete idea' });
  }
});

// Get ideas by industry
router.get('/industry/:industry', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ideas = await BusinessIdea.find({ 
      industry: req.params.industry,
      isPublic: true 
    })
      .populate('userId', 'firstName lastName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusinessIdea.countDocuments({ 
      industry: req.params.industry,
      isPublic: true 
    });

    res.json({
      ideas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get ideas by industry error:', error);
    res.status(500).json({ error: 'Failed to get ideas by industry' });
  }
});

// Get ideas by state
router.get('/state/:state', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ideas = await BusinessIdea.find({ 
      state: req.params.state,
      isPublic: true 
    })
      .populate('userId', 'firstName lastName username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusinessIdea.countDocuments({ 
      state: req.params.state,
      isPublic: true 
    });

    res.json({
      ideas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get ideas by state error:', error);
    res.status(500).json({ error: 'Failed to get ideas by state' });
  }
});

module.exports = router;
