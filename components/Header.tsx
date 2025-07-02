import React from 'react';
import { BotIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <BotIcon className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Fábrica de Prompts <span className="text-purple-600">IA</span>
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;