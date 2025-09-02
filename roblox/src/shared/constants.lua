--[[
  GetThis.Money Roblox Integration - Shared Constants
  This module contains all the constants used throughout the Roblox integration
  
  Author: Ryan Coleman <coleman.ryan@gmail.com>
  Version: 1.0.0
]]

local Constants = {
    -- Game Configuration
    MAX_PLAYERS = 50,
    MAX_IDEAS_PER_PLAYER = 10,
    COOLDOWN_BETWEEN_IDEAS = 300, -- 5 minutes in seconds
    
    -- Robux Rewards
    ROBUX_PER_IDEA = 5,
    ROBUX_PER_SUCCESSFUL_IDEA = 25,
    ROBUX_PER_MARKETPLACE_SALE = 10,
    DAILY_BONUS_ROBUX = 15,
    ACHIEVEMENT_REWARD_ROBUX = 50,
    
    -- Marketplace Configuration
    MARKETPLACE_COMMISSION = 0.10, -- 10%
    MIN_IDEA_PRICE = 1,
    MAX_IDEA_PRICE = 1000,
    
    -- Achievement System
    ACHIEVEMENTS = {
        {
            id = "first_idea",
            name = "First Idea",
            description = "Generate your first business idea",
            reward = 25,
            icon = "🎯",
            requirement = 1
        },
        {
            id = "idea_master",
            name = "Idea Master",
            description = "Generate 10 business ideas",
            reward = 100,
            icon = "💡",
            requirement = 10
        },
        {
            id = "entrepreneur",
            name = "Entrepreneur",
            description = "Sell your first idea in the marketplace",
            reward = 150,
            icon = "💰",
            requirement = 1
        },
        {
            id = "millionaire",
            name = "Robux Millionaire",
            description = "Earn 1000 Robux from business ideas",
            reward = 500,
            icon = "🏆",
            requirement = 1000
        },
        {
            id = "social_butterfly",
            name = "Social Butterfly",
            description = "Share 5 ideas with friends",
            reward = 75,
            icon = "🦋",
            requirement = 5
        },
        {
            id = "daily_streak_7",
            name = "Week Warrior",
            description = "Login for 7 consecutive days",
            reward = 100,
            icon = "📅",
            requirement = 7
        },
        {
            id = "daily_streak_30",
            name = "Monthly Master",
            description = "Login for 30 consecutive days",
            reward = 500,
            icon = "📆",
            requirement = 30
        },
        {
            id = "top_seller",
            name = "Top Seller",
            description = "Sell 10 ideas in the marketplace",
            reward = 200,
            icon = "📈",
            requirement = 10
        },
        {
            id = "creative_genius",
            name = "Creative Genius",
            description = "Generate ideas in 5 different industries",
            reward = 150,
            icon = "🎨",
            requirement = 5
        },
        {
            id = "community_leader",
            name = "Community Leader",
            description = "Have 5 of your ideas purchased by other players",
            reward = 300,
            icon = "👑",
            requirement = 5
        }
    },
    
    -- Industries
    INDUSTRIES = {
        "Technology & Software",
        "E-commerce & Retail",
        "Health & Wellness",
        "Education & Training",
        "Food & Beverage",
        "Fashion & Beauty",
        "Entertainment & Media",
        "Finance & Investment",
        "Real Estate",
        "Transportation & Logistics",
        "Manufacturing",
        "Consulting & Services",
        "Travel & Tourism",
        "Sports & Fitness",
        "Art & Design",
        "Environment & Sustainability",
        "Pet Care & Services",
        "Home & Garden",
        "Automotive",
        "Other"
    },
    
    -- Budget Levels
    BUDGET_LEVELS = {
        "Low ($1K-$10K)",
        "Medium ($10K-$50K)",
        "High ($50K-$200K)",
        "Enterprise ($200K+)"
    },
    
    -- Experience Levels
    EXPERIENCE_LEVELS = {
        "Beginner",
        "Intermediate",
        "Expert"
    },
    
    -- Time Commitment Levels
    TIME_COMMITMENT_LEVELS = {
        "Part-time (5-15 hours/week)",
        "Full-time (40+ hours/week)",
        "Side hustle (5-10 hours/week)"
    },
    
    -- UI Colors
    COLORS = {
        PRIMARY = Color3.fromRGB(59, 130, 246), -- Blue
        SUCCESS = Color3.fromRGB(34, 197, 94), -- Green
        WARNING = Color3.fromRGB(251, 191, 36), -- Yellow
        ERROR = Color3.fromRGB(239, 68, 68), -- Red
        BACKGROUND = Color3.fromRGB(17, 24, 39), -- Dark gray
        CARD = Color3.fromRGB(31, 41, 55), -- Lighter gray
        TEXT = Color3.fromRGB(243, 244, 246), -- Light text
        TEXT_SECONDARY = Color3.fromRGB(156, 163, 175) -- Muted text
    },
    
    -- UI Sizes
    SIZES = {
        BUTTON_HEIGHT = 40,
        CARD_PADDING = 16,
        BORDER_RADIUS = 8,
        FONT_SIZE_LARGE = 24,
        FONT_SIZE_MEDIUM = 16,
        FONT_SIZE_SMALL = 14
    },
    
    -- Animation Settings
    ANIMATIONS = {
        FADE_DURATION = 0.3,
        SLIDE_DURATION = 0.5,
        BOUNCE_DURATION = 0.6,
        HOVER_SCALE = 1.05
    },
    
    -- Sound Effects
    SOUNDS = {
        BUTTON_CLICK = "rbxasset://sounds/button_click.wav",
        IDEA_GENERATED = "rbxasset://sounds/idea_generated.wav",
        ROBUX_EARNED = "rbxasset://sounds/robux_earned.wav",
        ACHIEVEMENT_UNLOCKED = "rbxasset://sounds/achievement.wav",
        ERROR = "rbxasset://sounds/error.wav"
    },
    
    -- Error Messages
    ERROR_MESSAGES = {
        API_CONNECTION_FAILED = "Unable to connect to GetThis.Money API. Please check your internet connection.",
        RATE_LIMIT_EXCEEDED = "You're generating ideas too quickly. Please wait a moment.",
        INSUFFICIENT_ROBUX = "You don't have enough Robux for this action.",
        IDEA_NOT_FOUND = "The requested business idea could not be found.",
        MARKETPLACE_UNAVAILABLE = "The marketplace is currently unavailable. Please try again later.",
        INVALID_PREFERENCES = "Please provide valid preferences for idea generation.",
        SAVE_FAILED = "Failed to save your data. Please try again.",
        LOAD_FAILED = "Failed to load your data. Please refresh the game."
    },
    
    -- Success Messages
    SUCCESS_MESSAGES = {
        IDEA_GENERATED = "Business idea generated successfully!",
        IDEA_SAVED = "Business idea saved to your collection!",
        IDEA_PURCHASED = "Business idea purchased successfully!",
        IDEA_LISTED = "Business idea listed in marketplace!",
        ROBUX_EARNED = "Robux earned!",
        ACHIEVEMENT_UNLOCKED = "Achievement unlocked!",
        PREFERENCES_UPDATED = "Preferences updated successfully!",
        DATA_SAVED = "Your progress has been saved!"
    },
    
    -- Notification Types
    NOTIFICATION_TYPES = {
        SUCCESS = "success",
        ERROR = "error",
        WARNING = "warning",
        INFO = "info"
    },
    
    -- Data Store Keys
    DATA_STORE_KEYS = {
        PLAYER_DATA = "GetThisMoney_PlayerData",
        IDEAS = "GetThisMoney_Ideas",
        MARKETPLACE = "GetThisMoney_Marketplace",
        LEADERBOARD = "GetThisMoney_Leaderboard",
        ACHIEVEMENTS = "GetThisMoney_Achievements"
    },
    
    -- Cache Settings
    CACHE = {
        TIMEOUT = 300, -- 5 minutes
        MAX_ITEMS = 100,
        CLEANUP_INTERVAL = 600 -- 10 minutes
    },
    
    -- Rate Limiting
    RATE_LIMITS = {
        REQUESTS_PER_MINUTE = 60,
        REQUESTS_PER_HOUR = 1000,
        BURST_LIMIT = 10
    },
    
    -- Security
    SECURITY = {
        MAX_PASSWORD_LENGTH = 128,
        MIN_PASSWORD_LENGTH = 6,
        SESSION_TIMEOUT = 3600, -- 1 hour
        MAX_LOGIN_ATTEMPTS = 5,
        LOCKOUT_DURATION = 900 -- 15 minutes
    },
    
    -- Analytics Events
    ANALYTICS_EVENTS = {
        PLAYER_JOIN = "player_join",
        PLAYER_LEAVE = "player_leave",
        IDEA_GENERATED = "idea_generated",
        IDEA_SAVED = "idea_saved",
        IDEA_PURCHASED = "idea_purchased",
        IDEA_LISTED = "idea_listed",
        ROBUX_EARNED = "robux_earned",
        ACHIEVEMENT_UNLOCKED = "achievement_unlocked",
        DAILY_BONUS = "daily_bonus",
        MARKETPLACE_VISIT = "marketplace_visit",
        LEADERBOARD_VIEW = "leaderboard_view"
    }
}

return Constants
