import React from 'react';
import type { AppState } from '../App';
import { BotIcon, CheckCircleIcon } from './Icons';

interface HeaderProps {
    appState: AppState;
}

const ProgressIndicator: React.FC<{ appState: AppState }> = ({ appState }) => {
    const steps = ['1', '2', '3'];
    const currentStepIndex = appState === 'selecting_category' ? 0 : appState === 'selecting_recipe' ? 1 : 2;

    return (
        <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
                <div
                    key={step}
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-bold text-xs transition-all duration-300
                    ${index < currentStepIndex
                        ? 'bg-purple-600'
                        : index === currentStepIndex
                        ? 'bg-purple-600'
                        : 'bg-slate-300'
                    }`}
                >
                    {index < currentStepIndex ? (
                        <CheckCircleIcon className="h-5 w-5 text-white" />
                    ) : index === currentStepIndex ? (
                        <span className="text-white">{step}</span>
                    ) : (
                        <span className="text-slate-600">{step}</span>
                    )}
                </div>
            ))}
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ appState }) => {
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
          <ProgressIndicator appState={appState} />
        </div>
      </div>
    </header>
  );
};

export default Header;
