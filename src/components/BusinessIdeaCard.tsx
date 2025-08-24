import React from 'react';
import { BusinessIdea } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Lightbulb,
  Target,
  Building,
  Zap
} from 'lucide-react';

interface BusinessIdeaCardProps {
  idea: BusinessIdea;
}

const BusinessIdeaCard: React.FC<BusinessIdeaCardProps> = ({ idea }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="glass-effect rounded-lg p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{idea.title}</h2>
        <p className="text-gray-300 text-lg">{idea.description}</p>
      </div>

      {/* Revenue Estimates */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
          Revenue Estimates
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(idea.revenueEstimates.daily)}</div>
            <div className="text-sm text-gray-300">Per Day</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(idea.revenueEstimates.weekly)}</div>
            <div className="text-sm text-gray-300">Per Week</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(idea.revenueEstimates.monthly)}</div>
            <div className="text-sm text-gray-300">Per Month</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(idea.revenueEstimates.quarterly)}</div>
            <div className="text-sm text-gray-300">Per Quarter</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{formatCurrency(idea.revenueEstimates.yearly)}</div>
            <div className="text-sm text-gray-300">Per Year</div>
          </div>
        </div>
      </div>

      {/* Business Details Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Building className="h-4 w-4 mr-2 text-blue-400" />
              Business Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Industry:</span>
                <span className="text-white">{idea.industry}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Target Market:</span>
                <span className="text-white">{idea.targetMarket}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Revenue Model:</span>
                <span className="text-white">{idea.revenueModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Startup Cost:</span>
                <span className="text-white">{idea.startupCost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Timeline:</span>
                <span className="text-white">{idea.timeline}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-purple-400" />
              Location & Tax Info
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">State:</span>
                <span className="text-white">{idea.state}</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 mt-3">{idea.taxImplications}</p>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="bg-white/10 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
              AI Recommendations
            </h4>
            <div className="space-y-2">
              {idea.aiSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start">
                  <Zap className="h-3 w-3 text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <p className="text-sm text-gray-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-4 border border-green-500/30">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
              <Target className="h-4 w-4 mr-2 text-green-400" />
              Success Strategy
            </h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Focus on your target market: <span className="text-white font-medium">{idea.targetMarket}</span></p>
              <p>• Leverage the {idea.industry} growth potential</p>
              <p>• Start with {idea.startupCost} investment</p>
              <p>• Aim for {formatCurrency(idea.revenueEstimates.monthly)} monthly revenue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
          Generate Another Idea
        </button>
        <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105">
          Save This Idea
        </button>
        <button className="bg-white/10 border border-white/20 text-white py-3 px-6 rounded-lg font-semibold hover:bg-white/20 transition-all duration-200">
          Share Idea
        </button>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
          * Revenue estimates are projections based on industry averages and market conditions. 
          Actual results may vary. Always conduct thorough market research before starting any business.
        </p>
      </div>
    </div>
  );
};

export default BusinessIdeaCard;
