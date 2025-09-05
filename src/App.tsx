import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/Header';

// Import existing components
import PreferenceForm from './components/PreferenceForm';
import BusinessIdeaCard from './components/BusinessIdeaCard';
import { UserPreferences, BusinessIdea } from './types';
import { BusinessIdeasService } from './services/api';
import { Sparkles, ArrowLeft } from 'lucide-react';

// Legacy Home Component (keeping the original functionality)
const LegacyHome: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState<'form' | 'result'>('form');
  const [isLoading, setIsLoading] = React.useState(false);
  const [businessIdea, setBusinessIdea] = React.useState<BusinessIdea | null>(null);
  const [userPreferences, setUserPreferences] = React.useState<UserPreferences | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateIdea = async (preferences: UserPreferences) => {
    setIsLoading(true);
    setError(null);
    setUserPreferences(preferences);
    
    try {
      const idea = await BusinessIdeasService.generateIdea(preferences);
      setBusinessIdea(idea);
      setCurrentStep('result');
    } catch (error: any) {
      console.error('Failed to generate idea:', error);
      setError(error.response?.data?.message || 'Failed to generate business idea. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAnother = () => {
    if (userPreferences) {
      handleGenerateIdea(userPreferences);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setBusinessIdea(null);
    setError(null);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Generating your personalized business idea..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200 text-center">
            {error}
          </div>
        )}
        
        {currentStep === 'form' && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Generate Your Next
                <span className="block gradient-text">Million-Dollar Idea</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Our AI analyzes market trends, tax implications, and your preferences to create 
                personalized business opportunities with detailed revenue projections.
              </p>
            </div>
            
            <PreferenceForm onSubmit={handleGenerateIdea} isLoading={isLoading} />
            
            {/* Features Section */}
            <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="glass-effect rounded-lg p-6 text-center">
                <div className="bg-blue-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Ideas</h3>
                <p className="text-gray-300">Advanced algorithms generate unique business concepts tailored to your preferences</p>
              </div>
              
              <div className="glass-effect rounded-lg p-6 text-center">
                <div className="bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Revenue Estimates</h3>
                <p className="text-gray-300">Get detailed projections for daily, weekly, monthly, and yearly revenue potential</p>
              </div>
              
              <div className="glass-effect rounded-lg p-6 text-center">
                <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Tax Optimization</h3>
                <p className="text-gray-300">State-specific tax implications and business-friendly location recommendations</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'result' && businessIdea && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <button
                onClick={handleBackToForm}
                className="flex items-center text-gray-300 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Form
              </button>
            </div>
            
            <BusinessIdeaCard idea={businessIdea} />
            
            {/* Additional Ideas Section */}
            <div className="mt-12 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Want to explore more options?</h3>
              <button
                onClick={handleGenerateAnother}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                Generate Another Idea
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 GetThis.Money - AI-Powered Business Idea Generator. 
            All revenue estimates are projections and should not be considered financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={<LegacyHome />}
            />
            <Route
              path="/login"
              element={
                <ProtectedRoute requireAuth={false}>
                  <LoginForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/register"
              element={
                <ProtectedRoute requireAuth={false}>
                  <div>Register form will go here</div>
                </ProtectedRoute>
              }
            />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Dashboard will go here</div>
                </ProtectedRoute>
              }
            />
            
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: 'white',
                },
              },
            }}
          />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
