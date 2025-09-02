--[[
  GetThis.Money Roblox Integration - API Module
  This module handles all communication with the GetThis.Money backend API
  
  Author: Ryan Coleman <coleman.ryan@gmail.com>
  Version: 1.0.0
]]

local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- Import shared modules
local Constants = require(script.Parent.Parent.shared.constants)
local Utils = require(script.Parent.Parent.shared.utils)

-- API Configuration
local API_CONFIG = {
    baseUrl = "http://localhost:5000/api", -- Change to your server URL
    timeout = 30, -- seconds
    retries = 3,
    headers = {
        ["Content-Type"] = "application/json",
        ["User-Agent"] = "GetThisMoney-Roblox/1.0.0"
    }
}

-- Rate limiting
local requestCount = 0
local lastRequestTime = 0
local rateLimitWindow = 60 -- 1 minute
local maxRequestsPerMinute = 60

-- Cache for API responses
local cache = {}
local cacheTimeout = 300 -- 5 minutes

-- Helper function to make HTTP requests
local function makeRequest(method, endpoint, data, headers)
    local url = API_CONFIG.baseUrl .. endpoint
    local requestHeaders = {}
    
    -- Merge default headers with custom headers
    for key, value in pairs(API_CONFIG.headers) do
        requestHeaders[key] = value
    end
    
    if headers then
        for key, value in pairs(headers) do
            requestHeaders[key] = value
        end
    end
    
    -- Rate limiting check
    local currentTime = os.time()
    if currentTime - lastRequestTime >= rateLimitWindow then
        requestCount = 0
        lastRequestTime = currentTime
    end
    
    if requestCount >= maxRequestsPerMinute then
        return nil, "Rate limit exceeded. Please try again later."
    end
    
    requestCount = requestCount + 1
    
    -- Check cache for GET requests
    if method == "GET" and cache[endpoint] then
        local cachedData = cache[endpoint]
        if currentTime - cachedData.timestamp < cacheTimeout then
            return cachedData.data, nil
        else
            cache[endpoint] = nil -- Remove expired cache
        end
    end
    
    -- Make the request
    local success, response = pcall(function()
        if method == "GET" then
            return HttpService:GetAsync(url, false, requestHeaders)
        elseif method == "POST" then
            return HttpService:PostAsync(url, data or "", Enum.HttpContentType.ApplicationJson, false, requestHeaders)
        elseif method == "PUT" then
            return HttpService:RequestAsync({
                Url = url,
                Method = "PUT",
                Headers = requestHeaders,
                Body = data or ""
            })
        elseif method == "DELETE" then
            return HttpService:RequestAsync({
                Url = url,
                Method = "DELETE",
                Headers = requestHeaders
            })
        end
    end)
    
    if success then
        -- Parse JSON response
        local success2, parsedResponse = pcall(function()
            return HttpService:JSONDecode(response)
        end)
        
        if success2 then
            -- Cache GET responses
            if method == "GET" then
                cache[endpoint] = {
                    data = parsedResponse,
                    timestamp = currentTime
                }
            end
            
            return parsedResponse, nil
        else
            return nil, "Failed to parse response: " .. tostring(parsedResponse)
        end
    else
        return nil, "Request failed: " .. tostring(response)
    end
end

-- Test API connection
local function testConnection()
    local response, error = makeRequest("GET", "/health")
    
    if response and response.status == "OK" then
        return true
    else
        return false, error or "Unknown error"
    end
end

-- Generate business idea
local function generateBusinessIdea(preferences)
    local data = {
        state = preferences.state or "",
        industry = preferences.industry or "",
        budget = preferences.budget or "",
        experience = preferences.experience or "",
        timeCommitment = preferences.timeCommitment or ""
    }
    
    local response, error = makeRequest("POST", "/business-ideas/generate", HttpService:JSONEncode(data))
    
    if response and response.success then
        return response.idea
    else
        return nil, error or "Failed to generate business idea"
    end
end

-- Get leaderboard data
local function getLeaderboard()
    local response, error = makeRequest("GET", "/business-ideas/leaderboard")
    
    if response and response.success then
        return response.leaderboard
    else
        return nil, error or "Failed to get leaderboard"
    end
end

-- Track analytics events
local function trackEvent(eventType, eventData)
    local data = {
        eventType = eventType,
        eventData = eventData,
        timestamp = os.time(),
        source = "roblox"
    }
    
    local response, error = makeRequest("POST", "/analytics/track", HttpService:JSONEncode(data))
    
    if not response or not response.success then
        warn("Failed to track event: " .. tostring(error))
    end
    
    return response and response.success
end

-- Get user profile
local function getUserProfile(userId)
    local response, error = makeRequest("GET", "/users/" .. userId)
    
    if response and response.success then
        return response.user
    else
        return nil, error or "Failed to get user profile"
    end
end

-- Update user preferences
local function updateUserPreferences(userId, preferences)
    local data = {
        preferredState = preferences.state or "",
        preferredIndustry = preferences.industry or "",
        budget = preferences.budget or "",
        experience = preferences.experience or "",
        timeCommitment = preferences.timeCommitment or ""
    }
    
    local response, error = makeRequest("PUT", "/users/" .. userId .. "/preferences", HttpService:JSONEncode(data))
    
    if response and response.success then
        return response.user
    else
        return nil, error or "Failed to update preferences"
    end
end

-- Save business idea
local function saveBusinessIdea(userId, idea)
    local data = {
        userId = userId,
        idea = idea
    }
    
    local response, error = makeRequest("POST", "/business-ideas", HttpService:JSONEncode(data))
    
    if response and response.success then
        return response.idea
    else
        return nil, error or "Failed to save business idea"
    end
end

-- Get marketplace ideas
local function getMarketplaceIdeas(filters)
    local queryParams = ""
    if filters then
        local params = {}
        for key, value in pairs(filters) do
            table.insert(params, key .. "=" .. HttpService:UrlEncode(tostring(value)))
        end
        queryParams = "?" .. table.concat(params, "&")
    end
    
    local response, error = makeRequest("GET", "/business-ideas/marketplace" .. queryParams)
    
    if response and response.success then
        return response.ideas
    else
        return nil, error or "Failed to get marketplace ideas"
    end
end

-- Purchase business idea
local function purchaseBusinessIdea(userId, ideaId, price)
    local data = {
        userId = userId,
        ideaId = ideaId,
        price = price
    }
    
    local response, error = makeRequest("POST", "/business-ideas/" .. ideaId .. "/purchase", HttpService:JSONEncode(data))
    
    if response and response.success then
        return response.transaction
    else
        return nil, error or "Failed to purchase business idea"
    end
end

-- Get user statistics
local function getUserStats(userId)
    local response, error = makeRequest("GET", "/users/" .. userId .. "/stats")
    
    if response and response.success then
        return response.stats
    else
        return nil, error or "Failed to get user statistics"
    end
end

-- Get available industries
local function getIndustries()
    local response, error = makeRequest("GET", "/data/industries")
    
    if response and response.success then
        return response.industries
    else
        return nil, error or "Failed to get industries"
    end
end

-- Get available states
local function getStates()
    local response, error = makeRequest("GET", "/data/states")
    
    if response and response.success then
        return response.states
    else
        return nil, error or "Failed to get states"
    end
end

-- Clear cache
local function clearCache()
    cache = {}
    print("🗑️ API cache cleared")
end

-- Get cache statistics
local function getCacheStats()
    local count = 0
    for _ in pairs(cache) do
        count = count + 1
    end
    
    return {
        cachedItems = count,
        cacheTimeout = cacheTimeout,
        rateLimitRemaining = maxRequestsPerMinute - requestCount
    }
end

-- Module exports
local API = {
    -- Configuration
    config = API_CONFIG,
    
    -- Core functions
    testConnection = testConnection,
    generateBusinessIdea = generateBusinessIdea,
    getLeaderboard = getLeaderboard,
    trackEvent = trackEvent,
    
    -- User functions
    getUserProfile = getUserProfile,
    updateUserPreferences = updateUserPreferences,
    getUserStats = getUserStats,
    
    -- Business idea functions
    saveBusinessIdea = saveBusinessIdea,
    getMarketplaceIdeas = getMarketplaceIdeas,
    purchaseBusinessIdea = purchaseBusinessIdea,
    
    -- Data functions
    getIndustries = getIndustries,
    getStates = getStates,
    
    -- Utility functions
    clearCache = clearCache,
    getCacheStats = getCacheStats
}

return API
