import React from 'react';
import { DollarSign, Zap, User, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Logo from './Logo';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="glass-effect rounded-lg mx-4 mt-4 p-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {/* Logo placeholder - replace with your actual logo */}
            <Logo variant="primary" size="medium" />
            {/* Fallback icons until logo is uploaded */}
            <DollarSign className="h-8 w-8 text-green-400" />
            <Zap className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">GetThis.Money</h1>
            <p className="text-sm text-gray-300">AI-Powered Business Idea Generator</p>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center space-x-6">
          {!isAuthenticated ? (
            <>
              <span className="text-sm text-gray-300">Generate • Estimate • Succeed</span>
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login"
                  className="text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link 
                to="/dashboard"
                className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link 
                to="/my-ideas"
                className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
              >
                My Ideas
              </Link>
              
              {/* User Menu */}
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Profile" 
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                  <span className="font-medium text-sm">
                    {user?.firstName || 'User'}
                  </span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                  <div className="py-2">
                    <Link 
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
