const mongoose = require('mongoose');

const revenueEstimatesSchema = new mongoose.Schema({
  daily: {
    type: Number,
    required: true
  },
  weekly: {
    type: Number,
    required: true
  },
  monthly: {
    type: Number,
    required: true
  },
  quarterly: {
    type: Number,
    required: true
  },
  yearly: {
    type: Number,
    required: true
  }
});

const businessIdeaSchema = new mongoose.Schema({
  // User who generated the idea
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Idea details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  targetMarket: {
    type: String,
    required: true
  },
  revenueModel: {
    type: String,
    required: true
  },
  startupCost: {
    type: String,
    required: true
  },
  timeline: {
    type: String,
    required: true
  },
  
  // Revenue estimates
  revenueEstimates: {
    type: revenueEstimatesSchema,
    required: true
  },
  
  // Location and tax info
  state: {
    type: String,
    required: true
  },
  taxImplications: {
    type: String,
    required: true
  },
  
  // AI suggestions
  aiSuggestions: [{
    type: String
  }],
  
  // User preferences used to generate the idea
  userPreferences: {
    state: String,
    industry: String,
    budget: String,
    experience: String,
    timeCommitment: String
  },
  
  // Idea status and metadata
  status: {
    type: String,
    enum: ['generated', 'saved', 'implemented', 'archived'],
    default: 'generated'
  },
  
  // User interactions
  isSaved: {
    type: Boolean,
    default: false
  },
  isShared: {
    type: Boolean,
    default: false
  },
  isExported: {
    type: Boolean,
    default: false
  },
  
  // Ratings and feedback
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    maxlength: 1000
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Notes and customizations
  notes: {
    type: String,
    maxlength: 2000
  },
  
  // Custom modifications
  customRevenueEstimates: {
    type: revenueEstimatesSchema
  },
  customModifications: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Sharing and collaboration
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  exportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
businessIdeaSchema.index({ userId: 1, createdAt: -1 });
businessIdeaSchema.index({ industry: 1 });
businessIdeaSchema.index({ state: 1 });
businessIdeaSchema.index({ status: 1 });
businessIdeaSchema.index({ isPublic: 1 });
businessIdeaSchema.index({ tags: 1 });

// Virtual for total potential revenue
businessIdeaSchema.virtual('totalPotentialRevenue').get(function() {
  return this.revenueEstimates.yearly;
});

// Virtual for formatted revenue estimates
businessIdeaSchema.virtual('formattedRevenueEstimates').get(function() {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return {
    daily: formatCurrency(this.revenueEstimates.daily),
    weekly: formatCurrency(this.revenueEstimates.weekly),
    monthly: formatCurrency(this.revenueEstimates.monthly),
    quarterly: formatCurrency(this.revenueEstimates.quarterly),
    yearly: formatCurrency(this.revenueEstimates.yearly)
  };
});

// Method to increment view count
businessIdeaSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to increment share count
businessIdeaSchema.methods.incrementShareCount = function() {
  this.shareCount += 1;
  this.isShared = true;
  return this.save();
};

// Method to increment export count
businessIdeaSchema.methods.incrementExportCount = function() {
  this.exportCount += 1;
  this.isExported = true;
  return this.save();
};

// Method to save idea
businessIdeaSchema.methods.saveIdea = function() {
  this.isSaved = true;
  this.status = 'saved';
  return this.save();
};

// Method to archive idea
businessIdeaSchema.methods.archiveIdea = function() {
  this.status = 'archived';
  return this.save();
};

// Method to mark as implemented
businessIdeaSchema.methods.markAsImplemented = function() {
  this.status = 'implemented';
  return this.save();
};

// Method to add tag
businessIdeaSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this.save();
};

// Method to remove tag
businessIdeaSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

// Method to share with user
businessIdeaSchema.methods.shareWithUser = function(userId, permission = 'view') {
  const existingShare = this.sharedWith.find(share => share.userId.toString() === userId.toString());
  
  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = new Date();
  } else {
    this.sharedWith.push({
      userId,
      permission,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove share
businessIdeaSchema.methods.removeShare = function(userId) {
  this.sharedWith = this.sharedWith.filter(share => share.userId.toString() !== userId.toString());
  return this.save();
};

// Static method to find public ideas
businessIdeaSchema.statics.findPublic = function() {
  return this.find({ isPublic: true }).populate('userId', 'firstName lastName username avatar');
};

// Static method to find by industry
businessIdeaSchema.statics.findByIndustry = function(industry) {
  return this.find({ industry: industry });
};

// Static method to find by state
businessIdeaSchema.statics.findByState = function(state) {
  return this.find({ state: state });
};

// Static method to find user's ideas
businessIdeaSchema.statics.findByUser = function(userId) {
  return this.find({ userId: userId }).sort({ createdAt: -1 });
};

// Static method to find saved ideas
businessIdeaSchema.statics.findSaved = function(userId) {
  return this.find({ userId: userId, isSaved: true }).sort({ updatedAt: -1 });
};

// JSON serialization
businessIdeaSchema.methods.toJSON = function() {
  const idea = this.toObject();
  return idea;
};

module.exports = mongoose.model('BusinessIdea', businessIdeaSchema);
