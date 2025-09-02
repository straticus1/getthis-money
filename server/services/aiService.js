const OpenAI = require('openai');
const axios = require('axios');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-service.log' }),
    new winston.transports.Console()
  ]
});

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.marketDataCache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Generate business idea using GPT-4
   */
  async generateBusinessIdea(preferences, userId) {
    try {
      logger.info('Generating business idea', { userId, preferences });

      // Get market data to inform the AI
      const marketData = await this.getMarketData(preferences.industry, preferences.state);
      
      // Create detailed prompt for AI
      const prompt = this.createBusinessIdeaPrompt(preferences, marketData);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9
      });

      const aiResponse = response.choices[0].message.content;
      const businessIdea = this.parseAIResponse(aiResponse, preferences);
      
      // Enhance with calculated revenue estimates
      businessIdea.revenueEstimates = await this.calculateAdvancedRevenue(
        businessIdea,
        preferences,
        marketData
      );

      // Add AI-powered suggestions
      businessIdea.aiSuggestions = await this.generateAISuggestions(
        businessIdea,
        preferences,
        marketData
      );

      logger.info('Business idea generated successfully', { userId, ideaTitle: businessIdea.title });
      
      return businessIdea;

    } catch (error) {
      logger.error('Failed to generate business idea', { error: error.message, userId });
      
      // Fallback to template-based generation
      return this.generateFallbackIdea(preferences);
    }
  }

  /**
   * System prompt for consistent AI responses
   */
  getSystemPrompt() {
    return `You are an expert business consultant and entrepreneur with deep knowledge of market trends, business models, and revenue optimization. Your task is to generate detailed, realistic business ideas based on user preferences and market data.

    Always respond with a JSON object containing:
    - title: Creative, specific business name
    - description: Detailed business concept (150-200 words)
    - targetMarket: Specific customer segments
    - revenueModel: How the business makes money
    - startupCost: Realistic cost range
    - timeline: Development timeline
    - competitiveAdvantage: What makes it unique
    - marketOpportunity: Why now is the right time
    - keyActivities: Main business activities
    - keyResources: Essential resources needed
    - keyPartners: Important partnerships
    - challenges: Potential obstacles and solutions
    - scalability: How the business can grow

    Focus on:
    - Realistic, actionable ideas
    - Current market trends and opportunities
    - Specific implementation details
    - Risk mitigation strategies
    - Technology integration where relevant`;
  }

  /**
   * Create detailed prompt for business idea generation
   */
  createBusinessIdeaPrompt(preferences, marketData) {
    return `Generate a detailed business idea based on these preferences and market conditions:

    USER PREFERENCES:
    - State: ${preferences.state}
    - Industry: ${preferences.industry}
    - Budget Level: ${preferences.budget}
    - Experience: ${preferences.experience}
    - Time Commitment: ${preferences.timeCommitment}

    MARKET DATA:
    - Industry Growth Rate: ${marketData.growthRate || 'N/A'}
    - Average Market Size: ${marketData.marketSize || 'N/A'}
    - Competition Level: ${marketData.competitionLevel || 'Moderate'}
    - Key Trends: ${marketData.trends?.join(', ') || 'Digital transformation, sustainability'}
    - State Tax Rate: ${marketData.stateTaxRate || 'N/A'}%
    - Business Environment: ${marketData.businessEnvironment || 'Moderate'}

    REQUIREMENTS:
    - Must be implementable with ${preferences.budget} budget
    - Suitable for ${preferences.experience} level entrepreneur
    - Designed for ${preferences.timeCommitment} commitment
    - Leverages ${preferences.state} market opportunities
    - Incorporates current ${preferences.industry} trends

    Generate a comprehensive business idea that addresses these specific conditions and provides actionable implementation guidance.`;
  }

  /**
   * Parse AI response into structured business idea
   */
  parseAIResponse(aiResponse, preferences) {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(aiResponse);
      
      return {
        id: Date.now().toString(),
        title: parsed.title,
        description: parsed.description,
        industry: preferences.industry,
        targetMarket: parsed.targetMarket,
        revenueModel: parsed.revenueModel,
        startupCost: parsed.startupCost,
        timeline: parsed.timeline,
        state: preferences.state,
        competitiveAdvantage: parsed.competitiveAdvantage,
        marketOpportunity: parsed.marketOpportunity,
        keyActivities: parsed.keyActivities || [],
        keyResources: parsed.keyResources || [],
        keyPartners: parsed.keyPartners || [],
        challenges: parsed.challenges || [],
        scalability: parsed.scalability,
        userPreferences: preferences,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.warn('Failed to parse AI response as JSON, using text extraction', { error: error.message });
      
      // Fallback: extract information from text
      return this.extractFromText(aiResponse, preferences);
    }
  }

  /**
   * Extract business idea from text response
   */
  extractFromText(text, preferences) {
    // Simple extraction logic
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      id: Date.now().toString(),
      title: this.extractField(text, 'title') || 'AI-Generated Business Idea',
      description: this.extractField(text, 'description') || text.substring(0, 300),
      industry: preferences.industry,
      targetMarket: this.extractField(text, 'target') || 'General market',
      revenueModel: this.extractField(text, 'revenue') || 'Service-based model',
      startupCost: this.extractField(text, 'cost') || '$10K-$50K',
      timeline: this.extractField(text, 'timeline') || '6-12 months',
      state: preferences.state,
      userPreferences: preferences,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Extract specific field from text
   */
  extractField(text, field) {
    const patterns = {
      title: /(?:title|name):\s*([^\n]+)/i,
      description: /(?:description|concept):\s*([^\n]+(?:\n[^\n:]+)*)/i,
      target: /(?:target|market|audience):\s*([^\n]+)/i,
      revenue: /(?:revenue|monetiz|business model):\s*([^\n]+)/i,
      cost: /(?:cost|investment|capital):\s*([^\n]+)/i,
      timeline: /(?:timeline|timeframe|duration):\s*([^\n]+)/i
    };

    const match = text.match(patterns[field]);
    return match ? match[1].trim() : null;
  }

  /**
   * Get market data for informed AI generation
   */
  async getMarketData(industry, state) {
    const cacheKey = `${industry}-${state}`;
    
    // Check cache first
    if (this.marketDataCache.has(cacheKey)) {
      const cached = this.marketDataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const [industryData, stateData, trends] = await Promise.all([
        this.getIndustryData(industry),
        this.getStateData(state),
        this.getIndustryTrends(industry)
      ]);

      const marketData = {
        growthRate: industryData.growthRate,
        marketSize: industryData.marketSize,
        competitionLevel: industryData.competitionLevel,
        stateTaxRate: stateData.taxRate,
        businessEnvironment: stateData.businessEnvironment,
        trends: trends,
        lastUpdated: new Date().toISOString()
      };

      // Cache the results
      this.marketDataCache.set(cacheKey, {
        data: marketData,
        timestamp: Date.now()
      });

      return marketData;

    } catch (error) {
      logger.warn('Failed to fetch market data, using defaults', { error: error.message });
      
      return {
        growthRate: '8-12%',
        marketSize: '$1M-$10M',
        competitionLevel: 'Moderate',
        trends: ['Digital transformation', 'Sustainability focus'],
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Get industry-specific data
   */
  async getIndustryData(industry) {
    // This would integrate with real market research APIs
    // For now, using intelligent defaults
    
    const industryDefaults = {
      'Technology & Software': {
        growthRate: '15-25%',
        marketSize: '$50M-$500M',
        competitionLevel: 'High'
      },
      'E-commerce & Retail': {
        growthRate: '10-20%',
        marketSize: '$20M-$200M',
        competitionLevel: 'High'
      },
      'Health & Wellness': {
        growthRate: '12-18%',
        marketSize: '$15M-$150M',
        competitionLevel: 'Moderate'
      }
      // Add more industries...
    };

    return industryDefaults[industry] || {
      growthRate: '8-12%',
      marketSize: '$10M-$100M',
      competitionLevel: 'Moderate'
    };
  }

  /**
   * Get state-specific business data
   */
  async getStateData(state) {
    // Load state data from database or external API
    const stateDefaults = {
      'California': { taxRate: 8.84, businessEnvironment: 'Complex but large market' },
      'Texas': { taxRate: 0, businessEnvironment: 'Business-friendly' },
      'New York': { taxRate: 7.25, businessEnvironment: 'Competitive but lucrative' }
      // Add more states...
    };

    return stateDefaults[state] || { taxRate: 5, businessEnvironment: 'Moderate' };
  }

  /**
   * Get current industry trends
   */
  async getIndustryTrends(industry) {
    // This would integrate with news APIs, Google Trends, etc.
    const trendDefaults = {
      'Technology & Software': ['AI/ML integration', 'Remote work tools', 'Cybersecurity'],
      'E-commerce & Retail': ['Social commerce', 'Sustainability', 'Personalization'],
      'Health & Wellness': ['Mental health focus', 'Telehealth', 'Preventive care']
    };

    return trendDefaults[industry] || ['Digital transformation', 'Customer experience'];
  }

  /**
   * Calculate advanced revenue estimates using AI
   */
  async calculateAdvancedRevenue(businessIdea, preferences, marketData) {
    try {
      const prompt = `Calculate realistic revenue estimates for this business:

      Business: ${businessIdea.title}
      Industry: ${businessIdea.industry}
      Target Market: ${businessIdea.targetMarket}
      Revenue Model: ${businessIdea.revenueModel}
      Budget: ${preferences.budget}
      Experience: ${preferences.experience}
      Market Size: ${marketData.marketSize}
      Growth Rate: ${marketData.growthRate}

      Provide daily, weekly, monthly, quarterly, and yearly revenue estimates based on:
      - Industry benchmarks
      - Market size and competition
      - User experience level
      - Business model viability
      - Geographic market factors

      Return only a JSON object with the revenue estimates.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 500
      });

      const revenueData = JSON.parse(response.choices[0].message.content);
      return revenueData;

    } catch (error) {
      logger.warn('Failed to calculate AI revenue, using fallback', { error: error.message });
      return this.calculateFallbackRevenue(preferences, businessIdea.industry);
    }
  }

  /**
   * Generate AI-powered suggestions
   */
  async generateAISuggestions(businessIdea, preferences, marketData) {
    try {
      const prompt = `Provide 5 strategic recommendations for this business:

      Business: ${businessIdea.title}
      Description: ${businessIdea.description}
      Industry: ${preferences.industry}
      Experience: ${preferences.experience}
      Market Trends: ${marketData.trends?.join(', ')}

      Focus on:
      - Implementation strategies
      - Growth opportunities
      - Risk mitigation
      - Market positioning
      - Competitive advantages

      Provide concise, actionable advice.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 400
      });

      return response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim() && (line.includes('-') || line.includes('•')))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .slice(0, 5);

    } catch (error) {
      logger.warn('Failed to generate AI suggestions, using fallback', { error: error.message });
      return this.getFallbackSuggestions(preferences);
    }
  }

  /**
   * Fallback idea generation when AI fails
   */
  generateFallbackIdea(preferences) {
    // Use the existing template-based system as fallback
    const fallbackTemplates = require('./fallbackIdeas.json');
    const industryTemplates = fallbackTemplates[preferences.industry] || fallbackTemplates.default;
    const template = industryTemplates[Math.floor(Math.random() * industryTemplates.length)];

    return {
      id: Date.now().toString(),
      ...template,
      industry: preferences.industry,
      state: preferences.state,
      userPreferences: preferences,
      revenueEstimates: this.calculateFallbackRevenue(preferences, preferences.industry),
      aiSuggestions: this.getFallbackSuggestions(preferences),
      isAIGenerated: false,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Fallback revenue calculation
   */
  calculateFallbackRevenue(preferences, industry) {
    const baseMultipliers = {
      "Technology & Software": { daily: 1500, monthly: 45000, yearly: 540000 },
      "E-commerce & Retail": { daily: 600, monthly: 18000, yearly: 216000 },
      "Health & Wellness": { daily: 450, monthly: 13500, yearly: 162000 }
    };

    const base = baseMultipliers[industry] || baseMultipliers["Technology & Software"];
    
    // Apply multipliers based on preferences
    const budgetMultiplier = preferences.budget === "High" ? 1.3 : preferences.budget === "Medium" ? 1.0 : 0.7;
    const experienceMultiplier = preferences.experience === "Expert" ? 1.4 : preferences.experience === "Intermediate" ? 1.1 : 0.8;
    
    const totalMultiplier = budgetMultiplier * experienceMultiplier;

    return {
      daily: Math.round(base.daily * totalMultiplier),
      weekly: Math.round(base.daily * totalMultiplier * 7),
      monthly: Math.round(base.monthly * totalMultiplier),
      quarterly: Math.round(base.monthly * totalMultiplier * 3),
      yearly: Math.round(base.yearly * totalMultiplier)
    };
  }

  /**
   * Fallback suggestions
   */
  getFallbackSuggestions(preferences) {
    const suggestions = [
      `Focus on ${preferences.industry} growth opportunities in ${preferences.state}`,
      `Start with ${preferences.budget} budget and scale gradually`,
      `Leverage your ${preferences.experience} level expertise`,
      `Consider ${preferences.timeCommitment} implementation strategy`,
      'Research local market conditions and competition'
    ];

    return suggestions;
  }

  /**
   * Generate business model canvas using AI
   */
  async generateBusinessCanvas(businessIdea) {
    try {
      const prompt = `Create a Business Model Canvas for: ${businessIdea.title}

      Description: ${businessIdea.description}
      Target Market: ${businessIdea.targetMarket}
      Revenue Model: ${businessIdea.revenueModel}

      Generate a detailed business model canvas with all 9 components:
      1. Key Partners
      2. Key Activities
      3. Key Resources
      4. Value Propositions
      5. Customer Relationships
      6. Channels
      7. Customer Segments
      8. Cost Structure
      9. Revenue Streams

      Return as JSON with detailed descriptions for each component.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      logger.error('Failed to generate business canvas', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate comprehensive business plan
   */
  async generateBusinessPlan(businessIdea, userPreferences) {
    try {
      const sections = [
        'executive-summary',
        'market-analysis',
        'competitive-analysis',
        'marketing-strategy',
        'operations-plan',
        'financial-projections',
        'risk-assessment',
        'implementation-timeline'
      ];

      const planSections = {};

      for (const section of sections) {
        planSections[section] = await this.generatePlanSection(section, businessIdea, userPreferences);
      }

      return {
        businessIdea: businessIdea.title,
        generatedAt: new Date().toISOString(),
        sections: planSections
      };

    } catch (error) {
      logger.error('Failed to generate business plan', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate specific business plan section
   */
  async generatePlanSection(section, businessIdea, userPreferences) {
    const prompts = {
      'executive-summary': `Write an executive summary for ${businessIdea.title}. Include the business concept, market opportunity, competitive advantages, financial highlights, and funding requirements.`,
      
      'market-analysis': `Analyze the market for ${businessIdea.title} in the ${businessIdea.industry} industry. Include market size, growth trends, target customer analysis, and market segmentation.`,
      
      'competitive-analysis': `Provide a competitive analysis for ${businessIdea.title}. Identify direct and indirect competitors, analyze their strengths and weaknesses, and define competitive positioning.`,
      
      'marketing-strategy': `Develop a marketing strategy for ${businessIdea.title}. Include target customer profiles, marketing channels, pricing strategy, and promotional tactics.`,
      
      'operations-plan': `Create an operations plan for ${businessIdea.title}. Include production/service delivery, technology requirements, staffing needs, and quality control measures.`,
      
      'financial-projections': `Develop 3-year financial projections for ${businessIdea.title}. Include revenue forecasts, expense projections, break-even analysis, and funding requirements.`,
      
      'risk-assessment': `Identify and analyze risks for ${businessIdea.title}. Include market risks, operational risks, financial risks, and mitigation strategies.`,
      
      'implementation-timeline': `Create a detailed implementation timeline for ${businessIdea.title}. Include key milestones, dependencies, and critical path activities for the first 18 months.`
    };

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "user",
        content: prompts[section] + `\n\nBusiness Details:\n${JSON.stringify(businessIdea, null, 2)}`
      }],
      temperature: 0.4,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  }
}

module.exports = AIService;
