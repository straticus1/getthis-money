const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic user information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() { return !this.oauthProvider; }, // Only required if not OAuth
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  
  // OAuth2 information
  oauthProvider: {
    type: String,
    enum: ['google', 'github', 'facebook', null],
    default: null
  },
  oauthId: {
    type: String,
    sparse: true
  },
  oauthProfile: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Profile information
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  
  // Business preferences
  preferredState: {
    type: String,
    default: ''
  },
  preferredIndustry: {
    type: String,
    default: ''
  },
  budget: {
    type: String,
    enum: ['Low', 'Medium', 'High', ''],
    default: ''
  },
  experience: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert', ''],
    default: ''
  },
  timeCommitment: {
    type: String,
    enum: ['Part-time', 'Full-time', ''],
    default: ''
  },
  
  // Account status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  
  // Subscription and usage
  subscription: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  subscriptionExpires: {
    type: Date,
    default: null
  },
  ideasGenerated: {
    type: Number,
    default: 0
  },
  ideasSaved: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ oauthProvider: 1, oauthId: 1 });
userSchema.index({ username: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.username || this.fullName;
});

// Pre-save middleware to hash password with memory leak prevention
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Limit password length to prevent memory attacks
    if (this.password && this.password.length > 128) {
      return next(new Error('Password too long'));
    }
    
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login count
userSchema.methods.incrementLoginCount = function() {
  this.loginCount += 1;
  this.lastLogin = new Date();
  return this.save();
};

// Method to check if user can generate more ideas
userSchema.methods.canGenerateIdeas = function() {
  const limits = {
    free: 5,
    premium: 50,
    enterprise: -1 // unlimited
  };
  
  const limit = limits[this.subscription];
  return limit === -1 || this.ideasGenerated < limit;
};

// Method to increment ideas generated
userSchema.methods.incrementIdeasGenerated = function() {
  this.ideasGenerated += 1;
  return this.save();
};

// Method to save idea
userSchema.methods.saveIdea = function() {
  this.ideasSaved += 1;
  return this.save();
};

// Static method to find by OAuth
userSchema.statics.findByOAuth = function(provider, oauthId) {
  return this.findOne({ oauthProvider: provider, oauthId: oauthId });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// JSON serialization
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
