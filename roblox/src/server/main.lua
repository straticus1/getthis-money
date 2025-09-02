--[[
  GetThis.Money Roblox Integration - Main Server Script
  This script handles the core game logic, API integration, and player management
  
  Author: Ryan Coleman <coleman.ryan@gmail.com>
  Version: 1.0.0
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local DataStoreService = game:GetService("DataStoreService")
local MarketplaceService = game:GetService("MarketplaceService")

-- Import modules
local API = require(script.Parent.api)
local Auth = require(script.Parent.auth)
local Business = require(script.Parent.business)
local Marketplace = require(script.Parent.marketplace)
local Rewards = require(script.Parent.rewards)
local WebSocket = require(script.Parent.websocket)

-- Import shared modules
local Constants = require(script.Parent.Parent.shared.constants)
local Utils = require(script.Parent.Parent.shared.utils)
local Types = require(script.Parent.Parent.shared.types)

-- Create RemoteEvents for client-server communication
local RemoteEvents = Instance.new("Folder")
RemoteEvents.Name = "RemoteEvents"
RemoteEvents.Parent = ReplicatedStorage

-- Create individual RemoteEvents
local GenerateIdeaEvent = Instance.new("RemoteEvent")
GenerateIdeaEvent.Name = "GenerateIdea"
GenerateIdeaEvent.Parent = RemoteEvents

local SaveIdeaEvent = Instance.new("RemoteEvent")
SaveIdeaEvent.Name = "SaveIdea"
SaveIdeaEvent.Parent = RemoteEvents

local GetMarketplaceEvent = Instance.new("RemoteEvent")
GetMarketplaceEvent.Name = "GetMarketplace"
GetMarketplaceEvent.Parent = RemoteEvents

local BuyIdeaEvent = Instance.new("RemoteEvent")
BuyIdeaEvent.Name = "BuyIdea"
BuyIdeaEvent.Parent = RemoteEvents

local GetLeaderboardEvent = Instance.new("RemoteEvent")
GetLeaderboardEvent.Name = "GetLeaderboard"
GetLeaderboardEvent.Parent = RemoteEvents

local GetAchievementsEvent = Instance.new("RemoteEvent")
GetAchievementsEvent.Name = "GetAchievements"
GetAchievementsEvent.Parent = RemoteEvents

-- Data stores for persistent data
local PlayerDataStore = DataStoreService:GetDataStore("GetThisMoney_PlayerData")
local IdeasDataStore = DataStoreService:GetDataStore("GetThisMoney_Ideas")
local MarketplaceDataStore = DataStoreService:GetDataStore("GetThisMoney_Marketplace")

-- Player data cache
local PlayerData = {}

-- Initialize the server
local function initializeServer()
    print("🎮 GetThis.Money Roblox Server Initializing...")
    
    -- Test API connection
    local success, response = pcall(function()
        return API.testConnection()
    end)
    
    if success then
        print("✅ API connection successful")
    else
        warn("❌ API connection failed: " .. tostring(response))
    end
    
    -- Initialize WebSocket connection for real-time updates
    WebSocket.initialize()
    
    print("🚀 GetThis.Money Roblox Server Ready!")
end

-- Load player data from DataStore
local function loadPlayerData(player)
    local success, data = pcall(function()
        return PlayerDataStore:GetAsync(player.UserId)
    end)
    
    if success and data then
        PlayerData[player.UserId] = data
        print("📊 Loaded data for player: " .. player.Name)
    else
        -- Create new player data
        PlayerData[player.UserId] = {
            userId = player.UserId,
            username = player.Name,
            joinDate = os.time(),
            lastLogin = os.time(),
            robux = 100, -- Starting Robux
            ideas = {},
            savedIdeas = {},
            achievements = {},
            marketplace = {
                listedIdeas = {},
                purchasedIdeas = {},
                totalEarnings = 0
            },
            stats = {
                ideasGenerated = 0,
                ideasSold = 0,
                totalEarnings = 0,
                loginStreak = 1
            },
            preferences = {
                preferredIndustry = "",
                preferredState = "",
                budget = "",
                experience = ""
            }
        }
        print("🆕 Created new data for player: " .. player.Name)
    end
end

-- Save player data to DataStore
local function savePlayerData(player)
    local success, error = pcall(function()
        PlayerDataStore:SetAsync(player.UserId, PlayerData[player.UserId])
    end)
    
    if success then
        print("💾 Saved data for player: " .. player.Name)
    else
        warn("❌ Failed to save data for player " .. player.Name .. ": " .. tostring(error))
    end
end

-- Handle player joining
local function onPlayerAdded(player)
    print("👋 Player joined: " .. player.Name .. " (ID: " .. player.UserId .. ")")
    
    -- Load player data
    loadPlayerData(player)
    
    -- Send welcome message
    local welcomeMessage = "Welcome to GetThis.Money! 🎉\nGenerate business ideas and earn Robux!"
    player:FindFirstChild("PlayerGui"):WaitForChild("MainGui").WelcomeLabel.Text = welcomeMessage
    
    -- Track analytics
    API.trackEvent("player_join", {
        userId = player.UserId,
        username = player.Name,
        timestamp = os.time()
    })
    
    -- Check for daily bonus
    local playerData = PlayerData[player.UserId]
    local lastLogin = playerData.lastLogin
    local currentTime = os.time()
    local timeDiff = currentTime - lastLogin
    
    -- If more than 24 hours since last login, give daily bonus
    if timeDiff > 86400 then -- 24 hours in seconds
        local bonus = Constants.DAILY_BONUS_ROBUX
        playerData.robux = playerData.robux + bonus
        playerData.stats.loginStreak = playerData.stats.loginStreak + 1
        
        -- Notify player
        local bonusMessage = "🎁 Daily Bonus: +" .. bonus .. " Robux!\nLogin streak: " .. playerData.stats.loginStreak .. " days"
        player:FindFirstChild("PlayerGui"):WaitForChild("MainGui").BonusLabel.Text = bonusMessage
        
        -- Track event
        API.trackEvent("daily_bonus", {
            userId = player.UserId,
            amount = bonus,
            streak = playerData.stats.loginStreak
        })
    end
    
    playerData.lastLogin = currentTime
    savePlayerData(player)
end

-- Handle player leaving
local function onPlayerRemoving(player)
    print("👋 Player left: " .. player.Name)
    
    -- Save player data
    savePlayerData(player)
    
    -- Clean up player data from cache
    PlayerData[player.UserId] = nil
    
    -- Track analytics
    API.trackEvent("player_leave", {
        userId = player.UserId,
        username = player.Name,
        timestamp = os.time()
    })
end

-- Handle idea generation request
local function onGenerateIdeaRequest(player, preferences)
    local playerData = PlayerData[player.UserId]
    
    -- Check cooldown
    local lastIdeaTime = playerData.lastIdeaTime or 0
    local currentTime = os.time()
    local timeDiff = currentTime - lastIdeaTime
    
    if timeDiff < Constants.COOLDOWN_BETWEEN_IDEAS then
        local remainingTime = Constants.COOLDOWN_BETWEEN_IDEAS - timeDiff
        GenerateIdeaEvent:FireClient(player, {
            success = false,
            error = "Please wait " .. remainingTime .. " seconds before generating another idea"
        })
        return
    end
    
    -- Check if player has reached idea limit
    if #playerData.ideas >= Constants.MAX_IDEAS_PER_PLAYER then
        GenerateIdeaEvent:FireClient(player, {
            success = false,
            error = "You have reached the maximum number of ideas. Please sell some in the marketplace."
        })
        return
    end
    
    -- Generate business idea using API
    local success, businessIdea = pcall(function()
        return API.generateBusinessIdea(preferences)
    end)
    
    if success and businessIdea then
        -- Add Roblox-specific data
        businessIdea.robloxData = {
            id = HttpService:GenerateGUID(),
            creatorId = player.UserId,
            creatorName = player.Name,
            createdAt = currentTime,
            price = 0, -- Free by default
            isListed = false,
            purchases = 0,
            rating = 0,
            reviews = {}
        }
        
        -- Add to player's ideas
        table.insert(playerData.ideas, businessIdea)
        playerData.lastIdeaTime = currentTime
        playerData.stats.ideasGenerated = playerData.stats.ideasGenerated + 1
        
        -- Give Robux reward
        local reward = Constants.ROBUX_PER_IDEA
        playerData.robux = playerData.robux + reward
        
        -- Check for achievements
        Rewards.checkAchievements(player, playerData)
        
        -- Save data
        savePlayerData(player)
        
        -- Send response to client
        GenerateIdeaEvent:FireClient(player, {
            success = true,
            idea = businessIdea,
            reward = reward,
            newBalance = playerData.robux
        })
        
        -- Track analytics
        API.trackEvent("idea_generated", {
            userId = player.UserId,
            ideaId = businessIdea.robloxData.id,
            industry = businessIdea.industry,
            reward = reward
        })
        
        print("💡 Generated idea for player: " .. player.Name)
    else
        GenerateIdeaEvent:FireClient(player, {
            success = false,
            error = "Failed to generate business idea. Please try again."
        })
        warn("❌ Failed to generate idea for player " .. player.Name .. ": " .. tostring(businessIdea))
    end
end

-- Handle save idea request
local function onSaveIdeaRequest(player, ideaId)
    local playerData = PlayerData[player.UserId]
    
    -- Find the idea
    local idea = nil
    for _, playerIdea in ipairs(playerData.ideas) do
        if playerIdea.robloxData.id == ideaId then
            idea = playerIdea
            break
        end
    end
    
    if idea then
        -- Add to saved ideas
        table.insert(playerData.savedIdeas, idea)
        savePlayerData(player)
        
        SaveIdeaEvent:FireClient(player, {
            success = true,
            message = "Idea saved successfully!"
        })
        
        print("💾 Player " .. player.Name .. " saved idea: " .. idea.title)
    else
        SaveIdeaEvent:FireClient(player, {
            success = false,
            error = "Idea not found"
        })
    end
end

-- Handle marketplace request
local function onGetMarketplaceRequest(player)
    local success, marketplaceData = pcall(function()
        return MarketplaceDataStore:GetAsync("marketplace")
    end)
    
    if success and marketplaceData then
        GetMarketplaceEvent:FireClient(player, {
            success = true,
            marketplace = marketplaceData
        })
    else
        GetMarketplaceEvent:FireClient(player, {
            success = true,
            marketplace = {}
        })
    end
end

-- Handle buy idea request
local function onBuyIdeaRequest(player, ideaId)
    local playerData = PlayerData[player.UserId]
    
    -- Get marketplace data
    local success, marketplaceData = pcall(function()
        return MarketplaceDataStore:GetAsync("marketplace")
    end)
    
    if not success then
        BuyIdeaEvent:FireClient(player, {
            success = false,
            error = "Marketplace unavailable"
        })
        return
    end
    
    -- Find the idea
    local idea = nil
    for _, listedIdea in ipairs(marketplaceData) do
        if listedIdea.robloxData.id == ideaId then
            idea = listedIdea
            break
        end
    end
    
    if not idea then
        BuyIdeaEvent:FireClient(player, {
            success = false,
            error = "Idea not found in marketplace"
        })
        return
    end
    
    -- Check if player has enough Robux
    if playerData.robux < idea.robloxData.price then
        BuyIdeaEvent:FireClient(player, {
            success = false,
            error = "Insufficient Robux"
        })
        return
    end
    
    -- Process purchase
    local success, error = pcall(function()
        return Marketplace.processPurchase(player, idea, playerData)
    end)
    
    if success then
        BuyIdeaEvent:FireClient(player, {
            success = true,
            message = "Purchase successful!",
            newBalance = playerData.robux
        })
        
        print("💰 Player " .. player.Name .. " purchased idea: " .. idea.title)
    else
        BuyIdeaEvent:FireClient(player, {
            success = false,
            error = "Purchase failed: " .. tostring(error)
        })
    end
end

-- Handle leaderboard request
local function onGetLeaderboardRequest(player)
    local success, leaderboardData = pcall(function()
        return API.getLeaderboard()
    end)
    
    if success then
        GetLeaderboardEvent:FireClient(player, {
            success = true,
            leaderboard = leaderboardData
        })
    else
        GetLeaderboardEvent:FireClient(player, {
            success = false,
            error = "Failed to load leaderboard"
        })
    end
end

-- Handle achievements request
local function onGetAchievementsRequest(player)
    local playerData = PlayerData[player.UserId]
    
    GetAchievementsEvent:FireClient(player, {
        success = true,
        achievements = playerData.achievements,
        availableAchievements = Constants.ACHIEVEMENTS
    })
end

-- Connect events
Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

GenerateIdeaEvent.OnServerEvent:Connect(onGenerateIdeaRequest)
SaveIdeaEvent.OnServerEvent:Connect(onSaveIdeaRequest)
GetMarketplaceEvent.OnServerEvent:Connect(onGetMarketplaceRequest)
BuyIdeaEvent.OnServerEvent:Connect(onBuyIdeaRequest)
GetLeaderboardEvent.OnServerEvent:Connect(onGetLeaderboardRequest)
GetAchievementsEvent.OnServerEvent:Connect(onGetAchievementsRequest)

-- Auto-save player data every 5 minutes
spawn(function()
    while true do
        wait(300) -- 5 minutes
        
        for _, player in ipairs(Players:GetPlayers()) do
            if PlayerData[player.UserId] then
                savePlayerData(player)
            end
        end
        
        print("💾 Auto-saved data for " .. #Players:GetPlayers() .. " players")
    end
end)

-- Initialize server
initializeServer()

print("🎮 GetThis.Money Roblox Server Script Loaded Successfully!")
