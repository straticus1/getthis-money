# 🎮 Roblox Integration Setup Guide

This guide will walk you through setting up the GetThis.Money Roblox integration step by step.

## 📋 Prerequisites

Before you begin, make sure you have:

1. **Roblox Studio** installed and updated
2. **GetThis.Money Backend** running (Node.js server)
3. **Roblox Developer Account** with API access
4. **Basic knowledge** of Roblox Studio and Lua scripting

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure Backend Connection

1. **Update API URL** in `src/server/api.lua`:
   ```lua
   local API_CONFIG = {
       baseUrl = "http://your-server-url:5000/api", -- Change this
       timeout = 30,
       retries = 3
   }
   ```

2. **Test API Connection**:
   ```bash
   # In your GetThis.Money server directory
   npm start
   ```

### Step 2: Import to Roblox Studio

1. **Open Roblox Studio**
2. **Create a new place** or open existing one
3. **Import the scripts**:
   - Copy `src/server/` folder to `ServerScriptService`
   - Copy `src/client/` folder to `StarterPlayerScripts`
   - Copy `src/shared/` folder to `ReplicatedStorage`

### Step 3: Configure Game Settings

1. **Set up DataStores**:
   - Go to Game Settings → Security
   - Enable "Allow HTTP Requests"
   - Enable "Allow Studio Access to API Services"

2. **Configure Place Settings**:
   - Set Max Players to 50
   - Enable "Load Character Appearances"
   - Set "Player Join Script" to load our client script

### Step 4: Test the Integration

1. **Publish the place** to Roblox
2. **Join the game** with a test account
3. **Verify functionality**:
   - Generate business ideas
   - Earn Robux
   - Access marketplace
   - View leaderboard

## 🔧 Detailed Setup

### Backend Configuration

#### 1. Environment Variables

Create a `.env` file in your server directory:

```env
# Roblox Integration
ROBLOX_API_URL=https://apis.roblox.com
ROBLOX_CLIENT_ID=your_roblox_client_id
ROBLOX_CLIENT_SECRET=your_roblox_client_secret
ROBLOX_REDIRECT_URI=http://localhost:3000/auth/roblox/callback

# Game Configuration
ROBLOX_GAME_ID=your_game_id
ROBLOX_PLACE_ID=your_place_id

# API Configuration
API_BASE_URL=http://localhost:5000/api
CORS_ORIGIN=http://localhost:3000

# Security
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

#### 2. Add Roblox Routes

Add these routes to your `server/routes/` directory:

```javascript
// server/routes/roblox.js
const express = require('express');
const router = express.Router();

// Roblox OAuth2 routes
router.get('/auth/roblox', (req, res) => {
    // Redirect to Roblox OAuth
});

router.get('/auth/roblox/callback', (req, res) => {
    // Handle OAuth callback
});

// Roblox-specific API endpoints
router.post('/business-ideas/generate-roblox', (req, res) => {
    // Generate ideas for Roblox players
});

router.get('/leaderboard/roblox', (req, res) => {
    // Get Roblox leaderboard
});

module.exports = router;
```

#### 3. Update Server Configuration

Add to your `server/server.js`:

```javascript
// Add Roblox routes
const robloxRoutes = require('./routes/roblox');
app.use('/api/roblox', robloxRoutes);

// Add CORS for Roblox
app.use(cors({
    origin: ['http://localhost:3000', 'https://www.roblox.com'],
    credentials: true
}));
```

### Roblox Studio Configuration

#### 1. Script Organization

Organize your scripts in Roblox Studio:

```
ServerScriptService/
├── GetThisMoney/
│   ├── main.lua
│   ├── api.lua
│   ├── auth.lua
│   ├── business.lua
│   ├── marketplace.lua
│   ├── rewards.lua
│   └── websocket.lua

StarterPlayerScripts/
├── GetThisMoney/
│   ├── main.lua
│   ├── ui.lua
│   ├── api.lua
│   └── events.lua

ReplicatedStorage/
├── GetThisMoney/
│   ├── constants.lua
│   ├── types.lua
│   └── utils.lua
```

#### 2. UI Setup

Create the main GUI:

1. **Insert a ScreenGui** into StarterGui
2. **Name it "GetThisMoneyGUI"**
3. **Add the UI elements** from `ui/MainGui.lua`

#### 3. DataStore Configuration

Configure DataStores in Game Settings:

1. **Go to Game Settings → Security**
2. **Enable "Allow HTTP Requests"**
3. **Add DataStore names**:
   - `GetThisMoney_PlayerData`
   - `GetThisMoney_Ideas`
   - `GetThisMoney_Marketplace`

### Security Configuration

#### 1. Content Filtering

Update `config/security.js`:

```javascript
contentFilter: {
    enabled: true,
    maxLength: 1000,
    bannedWords: ['inappropriate', 'spam', 'scam'],
    moderationLevel: 'strict'
}
```

#### 2. Rate Limiting

Configure rate limits in `config/roblox.js`:

```javascript
rateLimit: {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    burstLimit: 10
}
```

#### 3. Input Validation

Add validation to all user inputs:

```lua
-- In your Lua scripts
local function validateInput(input)
    if type(input) ~= "string" then
        return false, "Invalid input type"
    end
    
    if #input > 1000 then
        return false, "Input too long"
    end
    
    -- Check for banned words
    for _, word in ipairs(Constants.BANNED_WORDS) do
        if string.find(string.lower(input), word) then
            return false, "Inappropriate content"
        end
    end
    
    return true
end
```

## 🧪 Testing

### 1. Local Testing

Test in Roblox Studio:

```lua
-- Test script
local API = require(game.ServerScriptService.GetThisMoney.api)

-- Test API connection
local success, response = pcall(function()
    return API.testConnection()
end)

if success then
    print("✅ API connection successful")
else
    print("❌ API connection failed: " .. tostring(response))
end
```

### 2. Player Testing

Test with real players:

1. **Publish to Roblox**
2. **Invite test players**
3. **Monitor console logs**
4. **Check for errors**

### 3. Performance Testing

Monitor performance:

```lua
-- Add performance monitoring
local startTime = tick()
-- ... your code ...
local endTime = tick()
print("Operation took: " .. (endTime - startTime) .. " seconds")
```

## 🔍 Troubleshooting

### Common Issues

#### 1. API Connection Failed

**Symptoms**: Players can't generate ideas

**Solutions**:
- Check server is running
- Verify API URL is correct
- Check CORS settings
- Test with `curl` or Postman

#### 2. DataStore Errors

**Symptoms**: Player data not saving

**Solutions**:
- Enable DataStores in Game Settings
- Check DataStore names match
- Verify player has permission
- Add error handling

#### 3. UI Not Loading

**Symptoms**: No interface appears

**Solutions**:
- Check StarterGui setup
- Verify scripts are in correct locations
- Check for script errors in Output
- Test with different players

#### 4. Performance Issues

**Symptoms**: Game lagging or slow

**Solutions**:
- Optimize API calls
- Add caching
- Reduce update frequency
- Monitor memory usage

### Debug Mode

Enable debug mode in `config/development.js`:

```javascript
development: {
    debug: true,
    logLevel: 'debug',
    testMode: true
}
```

### Logging

Add comprehensive logging:

```lua
local function log(message, level)
    level = level or "info"
    local timestamp = os.date("%Y-%m-%d %H:%M:%S")
    print("[" .. timestamp .. "] [" .. level:upper() .. "] " .. message)
end

-- Usage
log("Player joined: " .. player.Name, "info")
log("API error: " .. error, "error")
```

## 📊 Monitoring

### 1. Analytics Setup

Configure analytics in `config/analytics.js`:

```javascript
analytics: {
    enabled: true,
    trackingEvents: [
        'player_join',
        'idea_generated',
        'robux_earned'
    ]
}
```

### 2. Performance Monitoring

Monitor key metrics:

- Player count
- API response times
- Memory usage
- Error rates
- Revenue per player

### 3. Error Tracking

Set up error tracking:

```lua
local function trackError(error, context)
    -- Send to your error tracking service
    API.trackEvent("error", {
        error = error,
        context = context,
        timestamp = os.time()
    })
end
```

## 🚀 Deployment

### 1. Production Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] Security review completed
- [ ] Performance optimized
- [ ] Error handling in place
- [ ] Monitoring configured
- [ ] Backup strategy ready

### 2. Gradual Rollout

1. **Test with small group** (10-20 players)
2. **Monitor for 24 hours**
3. **Expand to larger group** (100 players)
4. **Full deployment**

### 3. Rollback Plan

Have a rollback plan ready:

1. **Keep previous version** as backup
2. **Monitor key metrics**
3. **Have quick rollback procedure**
4. **Communicate with players**

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section**
2. **Review console logs**
3. **Test with minimal setup**
4. **Contact support**: coleman.ryan@gmail.com

## 📚 Additional Resources

- [Roblox Developer Hub](https://developer.roblox.com/)
- [Roblox API Documentation](https://developer.roblox.com/en-us/api-reference)
- [GetThis.Money Documentation](../DOCUMENTATION.txt)
- [Roblox Studio Guide](https://developer.roblox.com/en-us/learn-roblox/roblox-studio)

---

**Created by:** Ryan Coleman <coleman.ryan@gmail.com>
**Last Updated:** December 2024
