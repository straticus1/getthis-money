import React from 'react';
import { DollarSign, Zap } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="glass-effect rounded-lg mx-4 mt-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-green-400" />
            <Zap className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">GetThis.Money</h1>
            <p className="text-sm text-gray-300">AI-Powered Business Idea Generator</p>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm text-gray-300">Generate • Estimate • Succeed</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
