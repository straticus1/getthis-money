/**
 * GetThis.Money Theme Management Hook
 * Author: Ryan Coleman <coleman.ryan@gmail.com>
 * 
 * React hook for managing financial themes with TypeScript support
 */

import { useState, useEffect, useCallback } from 'react';

// Financial theme definitions
export interface FinancialTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  primary: string;
  secondary: string;
  accent: string;
  category: 'classic' | 'modern' | 'bold';
}

export const FINANCIAL_THEMES: FinancialTheme[] = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    description: 'Classic corporate look for serious business planning',
    icon: '💼',
    primary: '#3B82F6',
    secondary: '#8B5CF6', 
    accent: '#10B981',
    category: 'classic'
  },
  {
    id: 'money-green',
    name: 'Money Green',
    description: 'Rich green tones symbolizing growth and prosperity',
    icon: '💚',
    primary: '#16A34A',
    secondary: '#22C55E',
    accent: '#84CC16',
    category: 'bold'
  },
  {
    id: 'gold-rush',
    name: 'Gold Rush',
    description: 'Luxury gold theme for premium business ventures',
    icon: '🏆',
    primary: '#F59E0B',
    secondary: '#EAB308',
    accent: '#FCD34D',
    category: 'bold'
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Deep blue professional theme for enterprise planning',
    icon: '🏢',
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#06B6D4',
    category: 'classic'
  },
  {
    id: 'silver-premium',
    name: 'Silver Premium',
    description: 'Sophisticated silver theme for modern entrepreneurs',
    icon: '🥈',
    primary: '#64748B',
    secondary: '#94A3B8',
    accent: '#E2E8F0',
    category: 'modern'
  },
  {
    id: 'crypto-neon',
    name: 'Crypto Neon',
    description: 'Electric purple theme for digital-age startups',
    icon: '⚡',
    primary: '#7C3AED',
    secondary: '#A855F7',
    accent: '#06FFA5',
    category: 'modern'
  },
  {
    id: 'wall-street',
    name: 'Wall Street Dark',
    description: 'Sleek dark theme inspired by financial districts',
    icon: '🌃',
    primary: '#1F2937',
    secondary: '#374151',
    accent: '#10B981',
    category: 'modern'
  },
  {
    id: 'startup-orange',
    name: 'Startup Orange',
    description: 'Energetic orange theme for innovative ventures',
    icon: '🚀',
    primary: '#EA580C',
    secondary: '#F97316',
    accent: '#FED7AA',
    category: 'bold'
  }
];

const STORAGE_KEY = 'getthis-money-theme';
const DEFAULT_THEME = 'professional-blue';

export interface UseThemeReturn {
  currentTheme: string;
  currentThemeData: FinancialTheme;
  availableThemes: FinancialTheme[];
  setTheme: (themeId: string) => void;
  toggleThemeMenu: () => void;
  isThemeMenuOpen: boolean;
  setIsThemeMenuOpen: (open: boolean) => void;
  getThemesByCategory: (category: FinancialTheme['category']) => FinancialTheme[];
}

export const useTheme = (): UseThemeReturn => {
  const [currentTheme, setCurrentTheme] = useState<string>(DEFAULT_THEME);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState<boolean>(false);

  // Get current theme data
  const currentThemeData = FINANCIAL_THEMES.find(theme => theme.id === currentTheme) || FINANCIAL_THEMES[0];

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && FINANCIAL_THEMES.find(theme => theme.id === savedTheme)) {
      setCurrentTheme(savedTheme);
      applyThemeToDOM(savedTheme);
    } else {
      // Check system preference for dark mode
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'wall-street' : DEFAULT_THEME;
      setCurrentTheme(systemTheme);
      applyThemeToDOM(systemTheme);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (!savedTheme) {
        // Only auto-switch if user hasn't manually selected a theme
        const newTheme = e.matches ? 'wall-street' : DEFAULT_THEME;
        setCurrentTheme(newTheme);
        applyThemeToDOM(newTheme);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  // Apply theme to DOM
  const applyThemeToDOM = useCallback((themeId: string) => {
    const body = document.documentElement;
    
    // Remove existing theme attributes
    FINANCIAL_THEMES.forEach(theme => {
      body.removeAttribute(`data-theme`);
    });
    
    // Apply new theme if not default
    if (themeId !== 'professional-blue') {
      body.setAttribute('data-theme', themeId);
    }
    
    // Add theme changing class for transitions
    body.classList.add('theme-changing');
    setTimeout(() => {
      body.classList.remove('theme-changing');
    }, 300);
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { 
        themeId,
        theme: FINANCIAL_THEMES.find(t => t.id === themeId)
      }
    }));
  }, []);

  // Set theme function
  const setTheme = useCallback((themeId: string) => {
    if (!FINANCIAL_THEMES.find(theme => theme.id === themeId)) {
      console.warn(`Theme "${themeId}" not found`);
      return;
    }

    setCurrentTheme(themeId);
    localStorage.setItem(STORAGE_KEY, themeId);
    applyThemeToDOM(themeId);
    setIsThemeMenuOpen(false);
    
    console.log(`🎨 Theme switched to: ${FINANCIAL_THEMES.find(t => t.id === themeId)?.name}`);
  }, [applyThemeToDOM]);

  // Toggle theme menu
  const toggleThemeMenu = useCallback(() => {
    setIsThemeMenuOpen(prev => !prev);
  }, []);

  // Get themes by category
  const getThemesByCategory = useCallback((category: FinancialTheme['category']) => {
    return FINANCIAL_THEMES.filter(theme => theme.category === category);
  }, []);

  return {
    currentTheme,
    currentThemeData,
    availableThemes: FINANCIAL_THEMES,
    setTheme,
    toggleThemeMenu,
    isThemeMenuOpen,
    setIsThemeMenuOpen,
    getThemesByCategory
  };
};

// Utility functions for theme management
export const getThemeColors = (themeId: string): FinancialTheme | null => {
  return FINANCIAL_THEMES.find(theme => theme.id === themeId) || null;
};

export const isValidTheme = (themeId: string): boolean => {
  return FINANCIAL_THEMES.some(theme => theme.id === themeId);
};

// Custom hook for theme event listening
export const useThemeListener = (callback: (themeId: string, theme: FinancialTheme) => void) => {
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      callback(event.detail.themeId, event.detail.theme);
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChanged', handleThemeChange as EventListener);
  }, [callback]);
};
