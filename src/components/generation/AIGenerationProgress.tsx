import React, { useState, useEffect } from 'react';
import { UserPreferences, BusinessIdea } from '../../types';
import { BusinessIdeasService } from '../../services/api';
import { Sparkles, Brain, TrendingUp, MapPin, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

interface AIGenerationProgressProps {
  preferences: UserPreferences;
  onComplete: (idea: BusinessIdea) => void;
  onError: (error: string) => void;
}

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration: number; // in milliseconds
}

const AIGenerationProgress: React.FC<AIGenerationProgressProps> = ({
  preferences,
  onComplete,
  onError
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<GenerationStep[]>([
    {
      id: 'market-analysis',
      title: 'Analyzing Market Data',
      description: `Researching ${preferences.industry} trends in ${preferences.state}`,
      icon: <TrendingUp className="h-5 w-5" />,
      status: 'pending',
      duration: 2000
    },
    {
      id: 'ai-generation',
      title: 'AI Idea Generation',
      description: 'Creating personalized business concepts with GPT-4',
      icon: <Brain className="h-5 w-5" />,
      status: 'pending',
      duration: 3000
    },
    {
      id: 'revenue-calculation',
      title: 'Revenue Estimation',
      description: 'Calculating realistic financial projections',
      icon: <Sparkles className="h-5 w-5" />,
      status: 'pending',
      duration: 1500
    },
    {
      id: 'location-analysis',
      title: 'Location Analysis',
      description: 'Analyzing tax implications and business environment',
      icon: <MapPin className="h-5 w-5" />,
      status: 'pending',
      duration: 1000
    },
    {
      id: 'ai-suggestions',
      title: 'Strategic Recommendations',
      description: 'Generating AI-powered business insights',
      icon: <Lightbulb className="h-5 w-5" />,
      status: 'pending',
      duration: 2000
    }
  ]);
  
  const [startTime] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateBusinessIdea();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateBusinessIdea = async () => {
    try {
      // Start the generation process
      const ideaPromise = BusinessIdeasService.generateIdea(preferences);
      
      // Simulate step progression for better UX
      await simulateStepProgression();
      
      // Wait for the actual AI generation to complete
      const businessIdea = await ideaPromise;
      
      // Mark final step as complete
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === prev.length - 1 ? 'completed' : step.status
      })));

      // Brief delay before completing
      setTimeout(() => {
        onComplete(businessIdea);
      }, 500);

    } catch (error: any) {
      console.error('AI Generation failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate business idea';
      
      setError(errorMessage);
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === currentStepIndex ? 'error' : step.status
      })));
      
      setTimeout(() => {
        onError(errorMessage);
      }, 1000);
    }
  };

  const simulateStepProgression = async () => {
    for (let i = 0; i < steps.length; i++) {
      // Mark current step as processing
      setCurrentStepIndex(i);
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        status: index === i ? 'processing' : index < i ? 'completed' : 'pending'
      })));

      // Wait for the step duration
      await new Promise(resolve => setTimeout(resolve, steps[i].duration));

      // Mark step as completed (except the last one, which will be handled by the API response)
      if (i < steps.length - 1) {
        setSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === i ? 'completed' : step.status
        })));
      }
    }
  };

  const getStepStatusIcon = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'processing':
        return (
          <div className="h-5 w-5 relative">
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-400"></div>
            {step.icon}
          </div>
        );
      default:
        return step.icon;
    }
  };

  const getStepStatusColor = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'processing':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStepBackgroundColor = (step: GenerationStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/50';
      case 'error':
        return 'bg-red-500/20 border-red-500/50';
      case 'processing':
        return 'bg-blue-500/20 border-blue-500/50';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  const totalElapsedTime = Date.now() - startTime;
  const estimatedTotalTime = steps.reduce((acc, step) => acc + step.duration, 0);
  const progressPercentage = Math.min((totalElapsedTime / estimatedTotalTime) * 100, 95);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="glass-effect rounded-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full animate-pulse">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            AI is crafting your perfect business idea
          </h2>
          
          <p className="text-gray-300 mb-6">
            Our advanced AI is analyzing market data and generating personalized recommendations just for you
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-400">
            {Math.round(progressPercentage)}% complete
          </div>
        </div>

        {/* Generation Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`
                rounded-lg p-4 border transition-all duration-300
                ${getStepBackgroundColor(step)}
                ${step.status === 'processing' ? 'scale-105 shadow-lg' : ''}
              `}
            >
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 ${getStepStatusColor(step)}`}>
                  {getStepStatusIcon(step)}
                </div>
                
                <div className="flex-grow">
                  <h3 className={`font-semibold ${getStepStatusColor(step)}`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-300 mt-1">
                    {step.description}
                  </p>
                </div>

                {step.status === 'processing' && (
                  <div className="flex-shrink-0">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div>
                <h4 className="text-red-300 font-semibold">Generation Failed</h4>
                <p className="text-red-200 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Preferences Summary */}
        <div className="mt-8 bg-white/5 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-purple-400" />
            Your Preferences
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Industry:</span>
              <span className="text-white ml-2">{preferences.industry}</span>
            </div>
            <div>
              <span className="text-gray-400">Location:</span>
              <span className="text-white ml-2">{preferences.state}</span>
            </div>
            <div>
              <span className="text-gray-400">Budget:</span>
              <span className="text-white ml-2">{preferences.budget}</span>
            </div>
            <div>
              <span className="text-gray-400">Experience:</span>
              <span className="text-white ml-2">{preferences.experience}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerationProgress;
