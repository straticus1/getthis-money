const { states } = require('../data/states');
const { industries } = require('../data/industries');

// Business idea templates for different industries
const businessIdeas = {
  "Technology & Software": [
    {
      title: "AI-Powered Personal Finance Assistant",
      description: "A mobile app that uses AI to analyze spending patterns, provide personalized financial advice, and help users save money through smart budgeting recommendations.",
      targetMarket: "Young professionals aged 25-40",
      revenueModel: "Freemium with premium subscription tiers",
      startupCost: "$25K-$50K",
      timeline: "6-12 months"
    },
    {
      title: "Smart Home Energy Management Platform",
      description: "IoT-based system that optimizes home energy usage, integrates with smart devices, and provides real-time energy consumption analytics.",
      targetMarket: "Homeowners with smart home devices",
      revenueModel: "Hardware sales + monthly subscription",
      startupCost: "$75K-$150K",
      timeline: "12-18 months"
    },
    {
      title: "Remote Team Productivity Analytics",
      description: "SaaS platform that tracks team productivity, identifies bottlenecks, and provides insights to improve remote work efficiency.",
      targetMarket: "Remote-first companies and HR departments",
      revenueModel: "Per-user monthly subscription",
      startupCost: "$30K-$60K",
      timeline: "8-12 months"
    }
  ],
  "E-commerce & Retail": [
    {
      title: "Sustainable Fashion Marketplace",
      description: "Online platform connecting eco-conscious consumers with sustainable fashion brands, featuring carbon footprint tracking and ethical sourcing verification.",
      targetMarket: "Environmentally conscious consumers aged 18-45",
      revenueModel: "Commission on sales + premium listings",
      startupCost: "$15K-$40K",
      timeline: "4-8 months"
    },
    {
      title: "Local Artisan Food Delivery",
      description: "Platform connecting local food artisans with consumers, featuring curated food boxes and subscription services for specialty foods.",
      targetMarket: "Food enthusiasts and local business supporters",
      revenueModel: "Commission on orders + subscription fees",
      startupCost: "$20K-$50K",
      timeline: "6-10 months"
    },
    {
      title: "Personalized Gift Curation Service",
      description: "AI-driven gift recommendation platform that creates personalized gift boxes based on recipient preferences and occasions.",
      targetMarket: "Busy professionals and gift-givers",
      revenueModel: "Markup on products + curation fees",
      startupCost: "$10K-$30K",
      timeline: "3-6 months"
    }
  ],
  "Health & Wellness": [
    {
      title: "Virtual Mental Health Coaching Platform",
      description: "AI-powered mental health app providing personalized coaching, mood tracking, and wellness recommendations with optional human therapist integration.",
      targetMarket: "Individuals seeking mental health support",
      revenueModel: "Monthly subscription + premium features",
      startupCost: "$40K-$80K",
      timeline: "8-14 months"
    },
    {
      title: "Personalized Nutrition Planning App",
      description: "Mobile app that creates customized meal plans based on health goals, dietary restrictions, and local ingredient availability.",
      targetMarket: "Health-conscious individuals and fitness enthusiasts",
      revenueModel: "Freemium with premium meal plans",
      startupCost: "$25K-$50K",
      timeline: "6-10 months"
    },
    {
      title: "Corporate Wellness Program Management",
      description: "Platform helping companies implement and manage employee wellness programs, including fitness challenges and health tracking.",
      targetMarket: "HR departments and wellness coordinators",
      revenueModel: "Per-employee monthly fee",
      startupCost: "$35K-$70K",
      timeline: "10-16 months"
    }
  ],
  "Education & Training": [
    {
      title: "Micro-Learning Platform for Professionals",
      description: "Bite-sized learning modules for professional development, featuring industry-specific skills and certification tracking.",
      targetMarket: "Working professionals seeking career advancement",
      revenueModel: "Course sales + corporate subscriptions",
      startupCost: "$20K-$45K",
      timeline: "6-12 months"
    },
    {
      title: "Language Learning with AI Tutors",
      description: "AI-powered language learning app with personalized tutoring, conversation practice, and cultural immersion features.",
      targetMarket: "Language learners of all ages",
      revenueModel: "Freemium with premium features",
      startupCost: "$30K-$60K",
      timeline: "8-14 months"
    },
    {
      title: "Skill-Based Certification Marketplace",
      description: "Platform connecting learners with industry experts for skill certification, featuring project-based learning and portfolio building.",
      targetMarket: "Career changers and skill upgraders",
      revenueModel: "Commission on course sales + certification fees",
      startupCost: "$15K-$35K",
      timeline: "4-8 months"
    }
  ]
};

// Revenue estimation algorithms
const calculateRevenueEstimates = (industry, state, preferences) => {
  const industryData = industries.find(i => i.name === industry);
  const stateData = states.find(s => s.name === state);
  
  // Base revenue multipliers based on industry
  const baseMultipliers = {
    "Technology & Software": { daily: 1500, weekly: 10500, monthly: 45000, quarterly: 135000, yearly: 540000 },
    "E-commerce & Retail": { daily: 600, weekly: 4200, monthly: 18000, quarterly: 54000, yearly: 216000 },
    "Health & Wellness": { daily: 450, weekly: 3150, monthly: 13500, quarterly: 40500, yearly: 162000 },
    "Education & Training": { daily: 300, weekly: 2100, monthly: 9000, quarterly: 27000, yearly: 108000 },
    "Food & Beverage": { daily: 750, weekly: 5250, monthly: 22500, quarterly: 67500, yearly: 270000 },
    "Real Estate": { daily: 900, weekly: 6300, monthly: 27000, quarterly: 81000, yearly: 324000 },
    "Financial Services": { daily: 1200, weekly: 8400, monthly: 36000, quarterly: 108000, yearly: 432000 },
    "Marketing & Advertising": { daily: 600, weekly: 4200, monthly: 18000, quarterly: 54000, yearly: 216000 },
    "Professional Services": { daily: 900, weekly: 6300, monthly: 27000, quarterly: 81000, yearly: 324000 },
    "Entertainment & Media": { daily: 450, weekly: 3150, monthly: 13500, quarterly: 40500, yearly: 162000 }
  };

  const base = baseMultipliers[industry] || baseMultipliers["Technology & Software"];
  
  // Adjust based on state business-friendliness
  const stateMultiplier = stateData?.businessFriendly ? 1.1 : 0.9;
  
  // Adjust based on budget (higher budget = higher potential)
  const budgetMultiplier = preferences.budget === "High" ? 1.2 : preferences.budget === "Medium" ? 1.0 : 0.8;
  
  // Adjust based on experience
  const experienceMultiplier = preferences.experience === "Expert" ? 1.3 : preferences.experience === "Intermediate" ? 1.1 : 0.9;

  const finalMultiplier = stateMultiplier * budgetMultiplier * experienceMultiplier;

  return {
    daily: Math.round(base.daily * finalMultiplier),
    weekly: Math.round(base.weekly * finalMultiplier),
    monthly: Math.round(base.monthly * finalMultiplier),
    quarterly: Math.round(base.quarterly * finalMultiplier),
    yearly: Math.round(base.yearly * finalMultiplier)
  };
};

// Generate tax implications based on state
const generateTaxImplications = (state) => {
  const stateData = states.find(s => s.name === state);
  
  if (!stateData) return "Tax implications vary by state. Consult with a tax professional.";
  
  if (stateData.taxRate === 0) {
    return `Great choice! ${state} has no state corporate income tax, which means you'll keep more of your profits. This is excellent for business growth and reinvestment.`;
  } else if (stateData.taxRate < 5) {
    return `${state} has a relatively low corporate tax rate of ${stateData.taxRate}%. This is favorable for business operations and profit retention.`;
  } else {
    return `${state} has a corporate tax rate of ${stateData.taxRate}%. While higher than some states, ${stateData.description}`;
  }
};

// Generate AI suggestions based on collected data
const generateAISuggestions = (preferences) => {
  const suggestions = [];
  
  // State-based suggestions
  const stateData = states.find(s => s.name === preferences.state);
  if (stateData?.businessFriendly) {
    suggestions.push(`Consider leveraging ${preferences.state}'s business-friendly environment for faster growth and lower operational costs.`);
  }
  
  // Industry-based suggestions
  const industryData = industries.find(i => i.name === preferences.industry);
  if (industryData) {
    suggestions.push(`Focus on ${industryData.growthRate} growth potential in ${preferences.industry} with average revenue of ${industryData.avgRevenue}.`);
  }
  
  // Budget-based suggestions
  if (preferences.budget === "Low") {
    suggestions.push("Start with a lean MVP approach to validate your idea before scaling up.");
  } else if (preferences.budget === "High") {
    suggestions.push("Consider building a comprehensive solution with advanced features to capture market share quickly.");
  }
  
  // Experience-based suggestions
  if (preferences.experience === "Beginner") {
    suggestions.push("Partner with experienced mentors or advisors to accelerate your learning curve.");
  } else if (preferences.experience === "Expert") {
    suggestions.push("Leverage your expertise to create high-value, differentiated offerings in the market.");
  }
  
  // Time commitment suggestions
  if (preferences.timeCommitment === "Part-time") {
    suggestions.push("Focus on automated or scalable business models that don't require constant attention.");
  } else {
    suggestions.push("Consider rapid expansion strategies to maximize your full-time commitment.");
  }
  
  return suggestions;
};

// Main AI generator function
const generateBusinessIdea = (preferences) => {
  const industryIdeas = businessIdeas[preferences.industry];
  const selectedIdea = industryIdeas ? industryIdeas[Math.floor(Math.random() * industryIdeas.length)] : {
    title: "AI-Powered Business Solution",
    description: "A comprehensive business solution leveraging artificial intelligence to solve industry-specific challenges.",
    targetMarket: "Businesses seeking digital transformation",
    revenueModel: "SaaS subscription model",
    startupCost: "$50K-$100K",
    timeline: "12-18 months"
  };

  const revenueEstimates = calculateRevenueEstimates(preferences.industry, preferences.state, preferences);
  const taxImplications = generateTaxImplications(preferences.state);
  const aiSuggestions = generateAISuggestions(preferences);

  return {
    title: selectedIdea.title,
    description: selectedIdea.description,
    industry: preferences.industry,
    targetMarket: selectedIdea.targetMarket,
    revenueModel: selectedIdea.revenueModel,
    startupCost: selectedIdea.startupCost,
    timeline: selectedIdea.timeline,
    revenueEstimates,
    state: preferences.state,
    taxImplications,
    aiSuggestions
  };
};

// Generate multiple ideas for comparison
const generateMultipleIdeas = (preferences, count = 3) => {
  const ideas = [];
  for (let i = 0; i < count; i++) {
    ideas.push(generateBusinessIdea(preferences));
  }
  return ideas;
};

module.exports = {
  generateBusinessIdea,
  generateMultipleIdeas,
  calculateRevenueEstimates,
  generateTaxImplications,
  generateAISuggestions
};
