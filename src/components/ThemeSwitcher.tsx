/**
 * GetThis.Money Theme Switcher Component
 * Author: Ryan Coleman <coleman.ryan@gmail.com>
 * 
 * React component for switching between financial themes
 */

import React, { useEffect, useRef } from 'react';
import { Palette, X } from 'lucide-react';
import { useTheme, type FinancialTheme } from '../hooks/useTheme';

interface ThemeSwitcherProps {
  className?: string;
  variant?: 'floating' | 'inline' | 'header';
  showCategories?: boolean;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  className = '',
  variant = 'floating',
  showCategories = true
}) => {
  const {
    currentTheme,
    currentThemeData,
    availableThemes,
    setTheme,
    toggleThemeMenu,
    isThemeMenuOpen,
    setIsThemeMenuOpen,
    getThemesByCategory
  } = useTheme();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isThemeMenuOpen, setIsThemeMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isThemeMenuOpen) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isThemeMenuOpen, setIsThemeMenuOpen]);

  const ThemeOption: React.FC<{ theme: FinancialTheme }> = ({ theme }) => (
    <button
      onClick={() => setTheme(theme.id)}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
        hover:bg-white/10 hover:transform hover:scale-[1.02]
        ${currentTheme === theme.id ? 'bg-white/15 ring-2 ring-white/30' : ''}
        group
      `}
      aria-label={`Switch to ${theme.name} theme`}
    >
      <div className="flex items-center gap-3 flex-1">
        <span className="text-xl" role="img" aria-label={theme.name}>
          {theme.icon}
        </span>
        <div className="flex-1 text-left">
          <div className="text-white font-medium text-sm">
            {theme.name}
          </div>
          <div className="text-gray-300 text-xs">
            {theme.description}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <div
          className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
          style={{ backgroundColor: theme.primary }}
          title="Primary color"
        />
        <div
          className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
          style={{ backgroundColor: theme.secondary }}
          title="Secondary color"
        />
        <div
          className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
          style={{ backgroundColor: theme.accent }}
          title="Accent color"
        />
      </div>
    </button>
  );

  const CategorySection: React.FC<{ 
    category: FinancialTheme['category'];
    title: string;
    themes: FinancialTheme[];
  }> = ({ category, title, themes }) => (
    <div className="mb-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </h4>
      <div className="space-y-1">
        {themes.map(theme => (
          <ThemeOption key={theme.id} theme={theme} />
        ))}
      </div>
    </div>
  );

  const renderFloatingVariant = () => (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`} ref={menuRef}>
      {/* Theme Switcher Button */}
      <button
        onClick={toggleThemeMenu}
        className="
          glass-effect rounded-full p-4 text-white shadow-lg
          hover:bg-white/15 hover:scale-105 transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-white/30
        "
        aria-label="Change theme"
        aria-expanded={isThemeMenuOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label={currentThemeData.name}>
            {currentThemeData.icon}
          </span>
          <Palette className="h-5 w-5" />
        </div>
      </button>

      {/* Theme Menu */}
      {isThemeMenuOpen && (
        <div className="
          absolute bottom-20 right-0 w-80
          glass-effect rounded-2xl p-6 shadow-2xl
          animate-in fade-in slide-in-from-bottom-4 duration-300
          border border-white/20
        ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">
              Choose Your Theme
            </h3>
            <button
              onClick={() => setIsThemeMenuOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close theme menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            {showCategories ? (
              <>
                <CategorySection
                  category="classic"
                  title="Classic"
                  themes={getThemesByCategory('classic')}
                />
                <CategorySection
                  category="modern"
                  title="Modern"
                  themes={getThemesByCategory('modern')}
                />
                <CategorySection
                  category="bold"
                  title="Bold"
                  themes={getThemesByCategory('bold')}
                />
              </>
            ) : (
              <div className="space-y-1">
                {availableThemes.map(theme => (
                  <ThemeOption key={theme.id} theme={theme} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="text-xs text-gray-400 text-center">
              Current: <span className="text-white font-medium">{currentThemeData.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHeaderVariant = () => (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={toggleThemeMenu}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          text-gray-300 hover:text-white hover:bg-white/10
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-white/30
        "
        aria-label="Change theme"
        aria-expanded={isThemeMenuOpen}
      >
        <span className="text-lg" role="img" aria-label={currentThemeData.name}>
          {currentThemeData.icon}
        </span>
        <Palette className="h-4 w-4" />
      </button>

      {isThemeMenuOpen && (
        <div className="
          absolute top-full right-0 mt-2 w-72
          glass-effect rounded-xl p-4 shadow-xl
          animate-in fade-in slide-in-from-top-2 duration-200
          border border-white/20
        ">
          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            {showCategories ? (
              <>
                <CategorySection
                  category="classic"
                  title="Classic"
                  themes={getThemesByCategory('classic')}
                />
                <CategorySection
                  category="modern"
                  title="Modern"
                  themes={getThemesByCategory('modern')}
                />
                <CategorySection
                  category="bold"
                  title="Bold"
                  themes={getThemesByCategory('bold')}
                />
              </>
            ) : (
              <div className="space-y-1">
                {availableThemes.map(theme => (
                  <ThemeOption key={theme.id} theme={theme} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderInlineVariant = () => (
    <div className={`${className}`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {availableThemes.map(theme => (
          <button
            key={theme.id}
            onClick={() => setTheme(theme.id)}
            className={`
              p-3 rounded-lg glass-effect text-center transition-all duration-200
              hover:bg-white/10 hover:scale-105
              ${currentTheme === theme.id ? 'ring-2 ring-white/30 bg-white/15' : ''}
            `}
            aria-label={`Switch to ${theme.name} theme`}
          >
            <div className="text-2xl mb-1" role="img" aria-label={theme.name}>
              {theme.icon}
            </div>
            <div className="text-xs text-white font-medium">
              {theme.name}
            </div>
            <div className="flex justify-center gap-1 mt-2">
              <div
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: theme.primary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: theme.secondary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-white/30"
                style={{ backgroundColor: theme.accent }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  switch (variant) {
    case 'header':
      return renderHeaderVariant();
    case 'inline':
      return renderInlineVariant();
    case 'floating':
    default:
      return renderFloatingVariant();
  }
};

export default ThemeSwitcher;
