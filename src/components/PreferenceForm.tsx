import React, { useState } from 'react';
import { UserPreferences } from '../types';
import { states } from '../data/states';
import { industries } from '../data/industries';
import { ChevronDown, MapPin, Building, DollarSign, Clock, User } from 'lucide-react';

interface PreferenceFormProps {
  onSubmit: (preferences: UserPreferences) => void;
  isLoading: boolean;
}

const PreferenceForm: React.FC<PreferenceFormProps> = ({ onSubmit, isLoading }) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    state: '',
    industry: '',
    budget: '',
    experience: '',
    timeCommitment: ''
  });

  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preferences.state && preferences.industry && preferences.budget && preferences.experience && preferences.timeCommitment) {
      onSubmit(preferences);
    }
  };

  const handleStateSelect = (state: string) => {
    setPreferences(prev => ({ ...prev, state }));
    setShowStateDropdown(false);
  };

  const handleIndustrySelect = (industry: string) => {
    setPreferences(prev => ({ ...prev, industry }));
    setShowIndustryDropdown(false);
  };

  const selectedState = states.find(s => s.name === preferences.state);
  const selectedIndustry = industries.find(i => i.name === preferences.industry);

  return (
    <div className="glass-effect rounded-lg p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Let's Generate Your Business Idea</h2>
        <p className="text-gray-300">Tell us about your preferences and we'll create a personalized business opportunity</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* State Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Where do you want to launch your business?
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStateDropdown(!showStateDropdown)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
            >
              <span>{preferences.state || 'Select a state'}</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showStateDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg max-h-60 overflow-y-auto">
                {states.map((state) => (
                  <button
                    key={state.code}
                    type="button"
                    onClick={() => handleStateSelect(state.name)}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{state.name}</div>
                      <div className="text-sm text-gray-300">{state.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{state.taxRate}% tax</div>
                      <div className={`text-xs ${state.businessFriendly ? 'text-green-400' : 'text-yellow-400'}`}>
                        {state.businessFriendly ? 'Business-friendly' : 'Higher taxes'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Industry Selection */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <Building className="h-4 w-4 mr-2" />
            What industry interests you?
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
            >
              <span>{preferences.industry || 'Select an industry'}</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${showIndustryDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showIndustryDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg max-h-60 overflow-y-auto">
                {industries.map((industry) => (
                  <button
                    key={industry.name}
                    type="button"
                    onClick={() => handleIndustrySelect(industry.name)}
                    className="w-full px-4 py-3 text-left text-white hover:bg-white/10"
                  >
                    <div className="font-medium">{industry.name}</div>
                    <div className="text-sm text-gray-300">{industry.description}</div>
                    <div className="text-xs text-blue-300 mt-1">
                      Growth: {industry.growthRate} • Avg Revenue: {industry.avgRevenue}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            What's your startup budget?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Low', 'Medium', 'High'].map((budget) => (
              <button
                key={budget}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, budget }))}
                className={`py-3 px-4 rounded-lg border transition-colors ${
                  preferences.budget === budget
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                }`}
              >
                {budget}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <User className="h-4 w-4 mr-2" />
            What's your business experience level?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {['Beginner', 'Intermediate', 'Expert'].map((experience) => (
              <button
                key={experience}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, experience }))}
                className={`py-3 px-4 rounded-lg border transition-colors ${
                  preferences.experience === experience
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                }`}
              >
                {experience}
              </button>
            ))}
          </div>
        </div>

        {/* Time Commitment */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            How much time can you commit?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['Part-time', 'Full-time'].map((timeCommitment) => (
              <button
                key={timeCommitment}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, timeCommitment }))}
                className={`py-3 px-4 rounded-lg border transition-colors ${
                  preferences.timeCommitment === timeCommitment
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                }`}
              >
                {timeCommitment}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!preferences.state || !preferences.industry || !preferences.budget || !preferences.experience || !preferences.timeCommitment || isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
              Generating Your Business Idea...
            </div>
          ) : (
            'Generate Business Idea'
          )}
        </button>
      </form>

      {/* Selected Info Display */}
      {(selectedState || selectedIndustry) && (
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Selected Preferences:</h3>
          <div className="space-y-2 text-sm">
            {selectedState && (
              <div className="flex justify-between">
                <span className="text-gray-300">State:</span>
                <span className="text-white">{selectedState.name} ({selectedState.taxRate}% tax)</span>
              </div>
            )}
            {selectedIndustry && (
              <div className="flex justify-between">
                <span className="text-gray-300">Industry:</span>
                <span className="text-white">{selectedIndustry.name}</span>
              </div>
            )}
            {preferences.budget && (
              <div className="flex justify-between">
                <span className="text-gray-300">Budget:</span>
                <span className="text-white">{preferences.budget}</span>
              </div>
            )}
            {preferences.experience && (
              <div className="flex justify-between">
                <span className="text-gray-300">Experience:</span>
                <span className="text-white">{preferences.experience}</span>
              </div>
            )}
            {preferences.timeCommitment && (
              <div className="flex justify-between">
                <span className="text-gray-300">Time Commitment:</span>
                <span className="text-white">{preferences.timeCommitment}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferenceForm;
