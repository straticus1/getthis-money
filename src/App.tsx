import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ErrorBoundary from './components/common/ErrorBoundary';
import Header from './components/Header';
import ThemeSwitcher from './components/ThemeSwitcher';
import ThemeDemo from './components/ThemeDemo';

// Import existing components
import PreferenceForm from './components/PreferenceForm';
import BusinessIdeaCard from './components/BusinessIdeaCard';
import AIGenerationProgress from './components/generation/AIGenerationProgress';
import { UserPreferences, BusinessIdea } from './types';
import { Sparkles, ArrowLeft } from 'lucide-react';

// Legacy Home Component (keeping the original functionality)
const LegacyHome: React.FC = () => {
  const [currentStep, setCurrentStep] = React.useState<'form' | 'generating' | 'result'>('form');
  const [businessIdea, setBusinessIdea] = React.useState<BusinessIdea | null>(null);
  const [userPreferences, setUserPreferences] = React.useState<UserPreferences | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleGenerateIdea = async (preferences: UserPreferences) => {
    setError(null);
    setUserPreferences(preferences);
    setCurrentStep('generating');
  };

  const handleGenerationComplete = (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    setCurrentStep('result');
  };

  const handleGenerationError = (errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('form');
  };

  const handleGenerateAnother = () => {
    if (userPreferences) {
      setCurrentStep('generating');
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setBusinessIdea(null);
    setError(null);
  };


  return (
    <div className="min-h-screen bg-gradient-theme">
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
              <div className="bg-gradient-card p-4 rounded-full">
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
            
            <PreferenceForm onSubmit={handleGenerateIdea} isLoading={false} />
            
            {/* Features Section */}
            <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="glass-effect rounded-lg p-6 text-center">
                <div className="bg-theme-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-theme-primary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Ideas</h3>
                <p className="text-theme-secondary-text">Advanced algorithms generate unique business concepts tailored to your preferences</p>
              </div>
              
              <div className="glass-effect rounded-lg p-6 text-center">
                <div className="bg-theme-accent/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-theme-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Revenue Estimates</h3>
                <p className="text-theme-secondary-text">Get detailed projections for daily, weekly, monthly, and yearly revenue potential</p>
              </div>
              
              <div className="glass-effect rounded-lg p-6 text-center">
                <div className="bg-theme-secondary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-theme-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Tax Optimization</h3>
                <p className="text-theme-secondary-text">State-specific tax implications and business-friendly location recommendations</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'generating' && userPreferences && (
          <AIGenerationProgress
            preferences={userPreferences}
            onComplete={handleGenerationComplete}
            onError={handleGenerationError}
          />
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
                className="bg-gradient-card text-white py-3 px-8 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 transform hover:scale-105"
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
              path="/themes"
              element={<ThemeDemo />}
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
                  <RegisterForm />
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
          
          {/* Floating Theme Switcher */}
          <ThemeSwitcher variant="floating" />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
