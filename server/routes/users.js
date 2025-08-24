const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const BusinessIdea = require('../models/BusinessIdea');
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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('username').optional().trim().isLength({ min: 3 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('location').optional().trim(),
  body('website').optional().trim().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, username, bio, location, website } = req.body;

    // Check username availability if changing
    if (username && username !== req.user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Update fields
    if (firstName) req.user.firstName = firstName;
    if (lastName) req.user.lastName = lastName;
    if (username) req.user.username = username;
    if (bio !== undefined) req.user.bio = bio;
    if (location !== undefined) req.user.location = location;
    if (website !== undefined) req.user.website = website;

    await req.user.save();

    res.json({ 
      message: 'Profile updated successfully',
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update business preferences
router.put('/preferences', authenticateToken, [
  body('preferredState').optional().trim(),
  body('preferredIndustry').optional().trim(),
  body('budget').optional().isIn(['Low', 'Medium', 'High', '']),
  body('experience').optional().isIn(['Beginner', 'Intermediate', 'Expert', '']),
  body('timeCommitment').optional().isIn(['Part-time', 'Full-time', ''])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { preferredState, preferredIndustry, budget, experience, timeCommitment } = req.body;

    // Update preferences
    if (preferredState !== undefined) req.user.preferredState = preferredState;
    if (preferredIndustry !== undefined) req.user.preferredIndustry = preferredIndustry;
    if (budget !== undefined) req.user.budget = budget;
    if (experience !== undefined) req.user.experience = experience;
    if (timeCommitment !== undefined) req.user.timeCommitment = timeCommitment;

    await req.user.save();

    res.json({ 
      message: 'Preferences updated successfully',
      user: req.user.toJSON()
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user's business ideas
router.get('/ideas', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { userId: req.user._id };
    if (status) {
      query.status = status;
    }

    const ideas = await BusinessIdea.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusinessIdea.countDocuments(query);

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
    console.error('Get user ideas error:', error);
    res.status(500).json({ error: 'Failed to get ideas' });
  }
});

// Get user's saved ideas
router.get('/ideas/saved', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const ideas = await BusinessIdea.find({ 
      userId: req.user._id, 
      isSaved: true 
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusinessIdea.countDocuments({ 
      userId: req.user._id, 
      isSaved: true 
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
    console.error('Get saved ideas error:', error);
    res.status(500).json({ error: 'Failed to get saved ideas' });
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalIdeas = await BusinessIdea.countDocuments({ userId: req.user._id });
    const savedIdeas = await BusinessIdea.countDocuments({ 
      userId: req.user._id, 
      isSaved: true 
    });
    const sharedIdeas = await BusinessIdea.countDocuments({ 
      userId: req.user._id, 
      isShared: true 
    });

    const ideasByIndustry = await BusinessIdea.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const ideasByState = await BusinessIdea.aggregate([
      { $match: { userId: req.user._id } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalIdeas,
      savedIdeas,
      sharedIdeas,
      ideasByIndustry,
      ideasByState,
      subscription: req.user.subscription,
      ideasGenerated: req.user.ideasGenerated,
      ideasSaved: req.user.ideasSaved
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Delete account
router.delete('/account', authenticateToken, [
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;

    // Verify password
    const isPasswordValid = await req.user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    // Delete user's business ideas
    await BusinessIdea.deleteMany({ userId: req.user._id });

    // Delete user account
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
