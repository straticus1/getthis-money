--[[
  GetThis.Money Roblox Integration - Main Client Script
  This script handles player interactions, UI management, and client-side logic
  
  Author: Ryan Coleman <coleman.ryan@gmail.com>
  Version: 1.0.0
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local SoundService = game:GetService("SoundService")
local UserInputService = game:GetService("UserInputService")

-- Import modules
local UI = require(script.Parent.ui)
local API = require(script.Parent.api)
local Events = require(script.Parent.events)

-- Import shared modules
local Constants = require(script.Parent.Parent.shared.constants)
local Utils = require(script.Parent.Parent.shared.utils)

-- Get player and RemoteEvents
local player = Players.LocalPlayer
local RemoteEvents = ReplicatedStorage:WaitForChild("RemoteEvents")

-- Get individual RemoteEvents
local GenerateIdeaEvent = RemoteEvents:WaitForChild("GenerateIdea")
local SaveIdeaEvent = RemoteEvents:WaitForChild("SaveIdea")
local GetMarketplaceEvent = RemoteEvents:WaitForChild("GetMarketplace")
local BuyIdeaEvent = RemoteEvents:WaitForChild("BuyIdea")
local GetLeaderboardEvent = RemoteEvents:WaitForChild("GetLeaderboard")
local GetAchievementsEvent = RemoteEvents:WaitForChild("GetAchievements")

-- Player data
local playerData = {
    robux = 100,
    ideas = {},
    savedIdeas = {},
    achievements = {},
    stats = {
        ideasGenerated = 0,
        ideasSold = 0,
        totalEarnings = 0
    }
}

-- UI state
local currentScreen = "main"
local isLoading = false

-- Initialize the client
local function initializeClient()
    print("🎮 GetThis.Money Client Initializing...")
    
    -- Create UI
    UI.createMainInterface()
    
    -- Set up event handlers
    Events.setupEventHandlers()
    
    -- Load initial data
    loadPlayerData()
    
    print("✅ GetThis.Money Client Ready!")
end

-- Load player data from server
local function loadPlayerData()
    -- This would typically load from DataStore or server
    -- For now, we'll use default values
    print("📊 Loading player data...")
end

-- Handle idea generation
local function generateIdea(preferences)
    if isLoading then
        UI.showNotification("Please wait for the current request to complete.", "warning")
        return
    end
    
    isLoading = true
    UI.showLoadingIndicator(true)
    
    -- Call server to generate idea
    GenerateIdeaEvent:FireServer(preferences)
end

-- Handle idea generation response
local function onIdeaGenerated(response)
    isLoading = false
    UI.showLoadingIndicator(false)
    
    if response.success then
        -- Update player data
        playerData.robux = response.newBalance
        table.insert(playerData.ideas, response.idea)
        playerData.stats.ideasGenerated = playerData.stats.ideasGenerated + 1
        
        -- Update UI
        UI.updateRobuxDisplay(playerData.robux)
        UI.showBusinessIdea(response.idea)
        UI.showNotification("💡 Idea generated! +" .. response.reward .. " Robux earned!", "success")
        
        -- Play sound
        playSound(Constants.SOUNDS.IDEA_GENERATED)
        
        -- Check for achievements
        checkAchievements()
        
        print("💡 Generated idea: " .. response.idea.title)
    else
        UI.showNotification(response.error, "error")
        playSound(Constants.SOUNDS.ERROR)
    end
end

-- Handle save idea
local function saveIdea(ideaId)
    SaveIdeaEvent:FireServer(ideaId)
end

-- Handle save idea response
local function onIdeaSaved(response)
    if response.success then
        UI.showNotification("💾 Idea saved successfully!", "success")
        playSound(Constants.SOUNDS.BUTTON_CLICK)
    else
        UI.showNotification(response.error, "error")
        playSound(Constants.SOUNDS.ERROR)
    end
end

-- Handle marketplace request
local function loadMarketplace()
    GetMarketplaceEvent:FireServer()
end

-- Handle marketplace response
local function onMarketplaceLoaded(response)
    if response.success then
        UI.showMarketplace(response.marketplace)
    else
        UI.showNotification("Failed to load marketplace", "error")
    end
end

-- Handle buy idea
local function buyIdea(ideaId, price)
    if playerData.robux < price then
        UI.showNotification("Insufficient Robux!", "error")
        return
    end
    
    BuyIdeaEvent:FireServer(ideaId)
end

-- Handle buy idea response
local function onIdeaPurchased(response)
    if response.success then
        playerData.robux = response.newBalance
        UI.updateRobuxDisplay(playerData.robux)
        UI.showNotification("💰 Purchase successful!", "success")
        playSound(Constants.SOUNDS.ROBUX_EARNED)
    else
        UI.showNotification(response.error, "error")
        playSound(Constants.SOUNDS.ERROR)
    end
end

-- Handle leaderboard request
local function loadLeaderboard()
    GetLeaderboardEvent:FireServer()
end

-- Handle leaderboard response
local function onLeaderboardLoaded(response)
    if response.success then
        UI.showLeaderboard(response.leaderboard)
    else
        UI.showNotification("Failed to load leaderboard", "error")
    end
end

-- Handle achievements request
local function loadAchievements()
    GetAchievementsEvent:FireServer()
end

-- Handle achievements response
local function onAchievementsLoaded(response)
    if response.success then
        UI.showAchievements(response.achievements, response.availableAchievements)
    else
        UI.showNotification("Failed to load achievements", "error")
    end
end

-- Check for new achievements
local function checkAchievements()
    -- This would check if player has unlocked new achievements
    -- For now, we'll just show a placeholder
    print("🏆 Checking achievements...")
end

-- Play sound effect
local function playSound(soundName)
    local sound = Instance.new("Sound")
    sound.SoundId = soundName
    sound.Volume = 0.5
    sound.Parent = SoundService
    sound:Play()
    
    -- Clean up after playing
    sound.Ended:Connect(function()
        sound:Destroy()
    end)
end

-- Handle UI navigation
local function navigateToScreen(screenName)
    currentScreen = screenName
    
    if screenName == "main" then
        UI.showMainScreen()
    elseif screenName == "marketplace" then
        loadMarketplace()
    elseif screenName == "leaderboard" then
        loadLeaderboard()
    elseif screenName == "achievements" then
        loadAchievements()
    elseif screenName == "profile" then
        UI.showProfile(playerData)
    end
end

-- Handle keyboard shortcuts
local function onInputBegan(input, gameProcessed)
    if gameProcessed then return end
    
    if input.KeyCode == Enum.KeyCode.M then
        -- Toggle marketplace
        if currentScreen == "marketplace" then
            navigateToScreen("main")
        else
            navigateToScreen("marketplace")
        end
    elseif input.KeyCode == Enum.KeyCode.L then
        -- Toggle leaderboard
        if currentScreen == "leaderboard" then
            navigateToScreen("main")
        else
            navigateToScreen("leaderboard")
        end
    elseif input.KeyCode == Enum.KeyCode.A then
        -- Toggle achievements
        if currentScreen == "achievements" then
            navigateToScreen("main")
        else
            navigateToScreen("achievements")
        end
    elseif input.KeyCode == Enum.KeyCode.P then
        -- Toggle profile
        if currentScreen == "profile" then
            navigateToScreen("main")
        else
            navigateToScreen("profile")
        end
    end
end

-- Connect RemoteEvent handlers
GenerateIdeaEvent.OnClientEvent:Connect(onIdeaGenerated)
SaveIdeaEvent.OnClientEvent:Connect(onIdeaSaved)
GetMarketplaceEvent.OnClientEvent:Connect(onMarketplaceLoaded)
BuyIdeaEvent.OnClientEvent:Connect(onIdeaPurchased)
GetLeaderboardEvent.OnClientEvent:Connect(onLeaderboardLoaded)
GetAchievementsEvent.OnClientEvent:Connect(onAchievementsLoaded)

-- Connect input handler
UserInputService.InputBegan:Connect(onInputBegan)

-- Expose functions to UI
local ClientAPI = {
    generateIdea = generateIdea,
    saveIdea = saveIdea,
    buyIdea = buyIdea,
    navigateToScreen = navigateToScreen,
    getPlayerData = function() return playerData end,
    updatePlayerData = function(newData)
        for key, value in pairs(newData) do
            playerData[key] = value
        end
    end
}

-- Make API available to UI module
UI.setClientAPI(ClientAPI)

-- Initialize when player is ready
if player.Character and player.Character:FindFirstChild("Humanoid") then
    initializeClient()
else
    player.CharacterAdded:Connect(function()
        wait(1) -- Wait for character to fully load
        initializeClient()
    end)
end

print("🎮 GetThis.Money Client Script Loaded Successfully!")
