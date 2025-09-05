export interface BusinessIdea {
  id: string;
  title: string;
  description: string;
  industry: string;
  targetMarket: string;
  revenueModel: string;
  startupCost: string;
  timeline: string;
  revenueEstimates: RevenueEstimates;
  state: string;
  taxImplications: string;
  aiSuggestions: string[];
  
  // Enhanced AI fields
  competitiveAdvantage?: string;
  marketOpportunity?: string;
  keyActivities?: string[];
  keyResources?: string[];
  keyPartners?: string[];
  challenges?: string[];
  scalability?: string;
  isAIGenerated?: boolean;
  generatedAt?: string;
  userPreferences?: UserPreferences;
}

export interface RevenueEstimates {
  daily: number;
  weekly: number;
  monthly: number;
  quarterly: number;
  yearly: number;
}

export interface UserPreferences {
  state: string;
  industry: string;
  budget: string;
  experience: string;
  timeCommitment: string;
}

export interface StateInfo {
  name: string;
  code: string;
  taxRate: number;
  businessFriendly: boolean;
  description: string;
}

export interface IndustryInfo {
  name: string;
  description: string;
  growthRate: string;
  avgRevenue: string;
  startupCost: string;
}
