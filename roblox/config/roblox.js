// Roblox API Configuration for GetThis.Money
// This file contains all the configuration needed for Roblox integration

module.exports = {
  // Roblox API Configuration
  roblox: {
    // Roblox API endpoints
    apiUrl: process.env.ROBLOX_API_URL || 'https://apis.roblox.com',
    authUrl: process.env.ROBLOX_AUTH_URL || 'https://auth.roblox.com',
    marketplaceUrl: process.env.ROBLOX_MARKETPLACE_URL || 'https://www.roblox.com/catalog',
    
    // OAuth2 Configuration
    clientId: process.env.ROBLOX_CLIENT_ID || '',
    clientSecret: process.env.ROBLOX_CLIENT_SECRET || '',
    redirectUri: process.env.ROBLOX_REDIRECT_URI || 'http://localhost:3000/auth/roblox/callback',
    
    // Scopes for OAuth2
    scopes: [
      'openid',
      'profile',
      'email',
      'roblox.basic',
      'roblox.profile',
      'roblox.inventory',
      'roblox.purchases'
    ],
    
    // Rate limiting
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      burstLimit: 10
    }
  },

  // GetThis.Money API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
    timeout: 30000, // 30 seconds
    retries: 3,
    
    // Endpoints
    endpoints: {
      businessIdeas: '/business-ideas',
      auth: '/auth',
      users: '/users',
      analytics: '/analytics'
    }
  },

  // Game Configuration
  game: {
    // Roblox Game ID
    gameId: process.env.ROBLOX_GAME_ID || '',
    
    // Place ID (specific server)
    placeId: process.env.ROBLOX_PLACE_ID || '',
    
    // Game settings
    maxPlayers: 50,
    maxIdeasPerPlayer: 10,
    cooldownBetweenIdeas: 300, // 5 minutes in seconds
    
    // Virtual currency settings
    robuxRewards: {
      ideaGeneration: 5, // Robux per idea
      successfulIdea: 25, // Robux for successful ideas
      marketplaceSale: 10, // Robux commission on sales
      dailyBonus: 15, // Daily login bonus
      achievement: 50 // Achievement rewards
    }
  },

  // Security Configuration
  security: {
    // JWT settings
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key',
    jwtExpiry: '24h',
    
    // Session settings
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    sessionTimeout: 3600, // 1 hour
    
    // Content filtering
    contentFilter: {
      enabled: true,
      maxLength: 1000,
      bannedWords: ['inappropriate', 'spam', 'scam'],
      moderationLevel: 'strict' // strict, moderate, lenient
    },
    
    // Rate limiting
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },

  // Database Configuration
  database: {
    // MongoDB connection for Roblox data
    mongoUrl: process.env.ROBLOX_MONGODB_URI || 'mongodb://localhost:27017/getthis-money-roblox',
    
    // Collections
    collections: {
      players: 'roblox_players',
      ideas: 'roblox_business_ideas',
      transactions: 'roblox_transactions',
      achievements: 'roblox_achievements',
      marketplace: 'roblox_marketplace'
    }
  },

  // Analytics Configuration
  analytics: {
    enabled: true,
    trackingEvents: [
      'player_join',
      'idea_generated',
      'idea_purchased',
      'robux_earned',
      'achievement_unlocked',
      'marketplace_sale'
    ],
    
    // Metrics to track
    metrics: {
      dailyActiveUsers: true,
      revenuePerUser: true,
      ideaGenerationRate: true,
      marketplaceActivity: true,
      playerRetention: true
    }
  },

  // Marketplace Configuration
  marketplace: {
    enabled: true,
    commission: 0.10, // 10% commission on sales
    minPrice: 1, // Minimum Robux price
    maxPrice: 1000, // Maximum Robux price
    
    // Categories
    categories: [
      'Technology',
      'Food & Beverage',
      'Fashion',
      'Entertainment',
      'Education',
      'Health & Wellness',
      'Finance',
      'Real Estate',
      'Transportation',
      'Other'
    ],
    
    // Featured ideas (promoted)
    featuredIdeas: {
      maxCount: 10,
      rotationInterval: 3600 // 1 hour
    }
  },

  // Achievement System
  achievements: {
    enabled: true,
    achievements: [
      {
        id: 'first_idea',
        name: 'First Idea',
        description: 'Generate your first business idea',
        reward: 25,
        icon: '🎯'
      },
      {
        id: 'idea_master',
        name: 'Idea Master',
        description: 'Generate 10 business ideas',
        reward: 100,
        icon: '💡'
      },
      {
        id: 'entrepreneur',
        name: 'Entrepreneur',
        description: 'Sell your first idea in the marketplace',
        reward: 150,
        icon: '💰'
      },
      {
        id: 'millionaire',
        name: 'Robux Millionaire',
        description: 'Earn 1000 Robux from business ideas',
        reward: 500,
        icon: '🏆'
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Share 5 ideas with friends',
        reward: 75,
        icon: '🦋'
      }
    ]
  },

  // Notification System
  notifications: {
    enabled: true,
    types: [
      'idea_generated',
      'robux_earned',
      'achievement_unlocked',
      'marketplace_sale',
      'daily_bonus',
      'friend_activity'
    ],
    
    // Delivery methods
    delivery: {
      inGame: true,
      email: false, // Requires email permission
      push: false   // Requires push notification permission
    }
  },

  // Development Configuration
  development: {
    debug: process.env.NODE_ENV === 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    testMode: process.env.TEST_MODE === 'true',
    
    // Test accounts
    testAccounts: [
      {
        username: 'test_player_1',
        userId: 123456789,
        robux: 1000
      },
      {
        username: 'test_player_2',
        userId: 987654321,
        robux: 500
      }
    ]
  }
};
