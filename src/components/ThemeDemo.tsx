/**
 * GetThis.Money Theme Demo Component
 * Author: Ryan Coleman <coleman.ryan@gmail.com>
 * 
 * Interactive demo showcasing all financial themes
 */

import React from 'react';
import { Sparkles, TrendingUp, DollarSign, BarChart3, Target, Lightbulb } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import ThemeSwitcher from './ThemeSwitcher';

const ThemeDemo: React.FC = () => {
  const { currentThemeData, availableThemes } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-theme">
      {/* Header */}
      <div className="glass-effect mx-4 mt-4 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="h-8 w-8 text-theme-accent" />
            <div>
              <h1 className="text-2xl font-bold gradient-text">GetThis.Money</h1>
              <p className="text-sm text-theme-secondary-text">Financial Theme Demo</p>
            </div>
          </div>
          <ThemeSwitcher variant="header" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Current Theme Info */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 glass-effect rounded-full px-6 py-3 mb-6">
            <span className="text-2xl" role="img" aria-label={currentThemeData.name}>
              {currentThemeData.icon}
            </span>
            <div className="text-left">
              <div className="text-white font-semibold text-lg">
                {currentThemeData.name}
              </div>
              <div className="text-theme-secondary-text text-sm">
                {currentThemeData.description}
              </div>
            </div>
            <div className="flex gap-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-white/30"
                style={{ backgroundColor: currentThemeData.primary }}
                title="Primary"
              />
              <div
                className="w-6 h-6 rounded-full border-2 border-white/30"
                style={{ backgroundColor: currentThemeData.secondary }}
                title="Secondary"
              />
              <div
                className="w-6 h-6 rounded-full border-2 border-white/30"
                style={{ backgroundColor: currentThemeData.accent }}
                title="Accent"
              />
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4">
            Financial Theme System Demo
          </h2>
          <p className="text-xl text-theme-secondary-text max-w-2xl mx-auto">
            Experience how each theme transforms the look and feel of your business idea generator.
            Try switching themes using the palette icon above!
          </p>
        </div>

        {/* Theme Features Demo */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="glass-effect rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="bg-theme-primary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-theme-primary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI-Powered Generation</h3>
            <p className="text-theme-secondary-text mb-4">
              Generate unique business ideas with our advanced AI algorithms tailored to your preferences and market conditions.
            </p>
            <div className="bg-theme-primary text-white px-4 py-2 rounded-lg text-sm font-medium inline-block">
              Primary Theme Color
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="bg-theme-accent/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-theme-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Revenue Projections</h3>
            <p className="text-theme-secondary-text mb-4">
              Get detailed financial forecasts with daily, weekly, monthly, and yearly revenue estimates for your business concept.
            </p>
            <div className="bg-theme-accent text-white px-4 py-2 rounded-lg text-sm font-medium inline-block">
              Accent Theme Color
            </div>
          </div>

          <div className="glass-effect rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="bg-theme-secondary/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-theme-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Market Analysis</h3>
            <p className="text-theme-secondary-text mb-4">
              Comprehensive market research and competitive analysis to validate your business opportunity in real-time.
            </p>
            <div className="bg-theme-secondary text-white px-4 py-2 rounded-lg text-sm font-medium inline-block">
              Secondary Theme Color
            </div>
          </div>
        </div>

        {/* Sample Business Idea Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Sample Business Idea Preview
          </h3>
          <div className="glass-effect rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-card p-3 rounded-full">
                  <Lightbulb className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white">
                    AI-Powered Personal Finance Coach
                  </h4>
                  <p className="text-theme-secondary-text">
                    SaaS • Financial Technology • B2C
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-theme-accent">$847K</div>
                <div className="text-theme-secondary-text text-sm">Est. Annual Revenue</div>
              </div>
            </div>

            <p className="text-theme-secondary-text mb-6 leading-relaxed">
              An intelligent personal finance coaching platform that uses machine learning to analyze spending patterns, 
              provide personalized budgeting advice, and automate savings strategies. The platform offers real-time 
              financial insights and connects users with certified financial advisors for premium consultations.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-xl font-bold text-theme-primary">$69</div>
                <div className="text-theme-muted-text text-xs">Monthly Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-theme-secondary">$483</div>
                <div className="text-theme-muted-text text-xs">Weekly Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-theme-accent">$2,322</div>
                <div className="text-theme-muted-text text-xs">Daily Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-success">85%</div>
                <div className="text-theme-muted-text text-xs">Success Rate</div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="bg-theme-primary/20 text-theme-primary px-3 py-1 rounded-full text-sm font-medium">
                  FinTech
                </span>
                <span className="bg-theme-secondary/20 text-theme-secondary px-3 py-1 rounded-full text-sm font-medium">
                  AI/ML
                </span>
                <span className="bg-theme-accent/20 text-theme-accent px-3 py-1 rounded-full text-sm font-medium">
                  SaaS
                </span>
              </div>
              <button className="bg-gradient-card text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Generate Similar
              </button>
            </div>
          </div>
        </div>

        {/* All Themes Preview */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            All Available Themes
          </h3>
          <ThemeSwitcher variant="inline" showCategories={false} />
          
          <div className="mt-8 text-center">
            <p className="text-theme-secondary-text mb-4">
              Switch between {availableThemes.length} professionally designed themes optimized for financial applications.
            </p>
            <div className="glass-effect rounded-lg p-4 inline-block">
              <div className="text-theme-muted-text text-sm mb-2">Current Theme</div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentThemeData.icon}</span>
                <div className="text-left">
                  <div className="text-white font-semibold">{currentThemeData.name}</div>
                  <div className="text-theme-muted-text text-xs">{currentThemeData.category} • {currentThemeData.description}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Developer Info */}
        <div className="mt-16 text-center">
          <div className="glass-effect rounded-lg p-6 inline-block max-w-2xl">
            <Target className="h-8 w-8 text-theme-accent mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Theme System Features</h4>
            <ul className="text-theme-secondary-text text-sm space-y-1 text-left">
              <li>• 8 financial-focused color schemes</li>
              <li>• Automatic localStorage persistence</li>
              <li>• System dark/light mode detection</li>
              <li>• Smooth CSS transitions</li>
              <li>• TypeScript support with React hooks</li>
              <li>• Tailwind CSS integration</li>
              <li>• Accessibility-compliant design</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;
