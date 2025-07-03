import React, { useEffect, useState, useCallback, useMemo } from 'react';
import type { Recipe } from '../types';
import { CopyIcon, CheckIcon, SparklesIcon, AlertTriangleIcon, BuildIcon, LightbulbIcon } from './Icons';
import Spinner from './Spinner';
import StarRating from './StarRating';

const formatAIResponse = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

interface PromptBuilderProps {
  recipe: Recipe;
  promptValues: Record<string, string>;
  setPromptValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  finalPrompt: string;
  setFinalPrompt: React.Dispatch<React.SetStateAction<string>>;
  aiResponse: string;
  promptSuggestion: string;
  isLoading: boolean;
  isTakingLong: boolean; // <-- RECEBE O NOVO ESTADO
  isSuggestionLoading: boolean;
  error: string | null;
  onGenerate: (element: HTMLElement) => void;
  onCopy: (element: HTMLElement) => void;
  onRating: (rating: number) => void;
}

const PromptBuilder: React.FC<PromptBuilderProps> = ({
  recipe, promptValues, setPromptValues, finalPrompt, setFinalPrompt, 
  aiResponse, promptSuggestion, isLoading, isTakingLong, isSuggestionLoading, error, 
  onGenerate, onCopy, onRating
}) => {
  const [hasCopied, setHasCopied] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);

  const handleValueChange = (key: string, value: string) => {
    setPromptValues(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    let newPrompt = recipe.template;
    Object.entries(promptValues).forEach(([key, value]) => {
      if (value) {
        newPrompt = newPrompt.replace(key, value);
      }
    });
    setFinalPrompt(newPrompt);
  }, [promptValues, recipe.template, setFinalPrompt]);

  const promptParts = useMemo(() => {
    const regex = new RegExp(`(${recipe.placeholders.map(p => p.key.replace(/\[/g, '\\[').replace(/\]/g, '\\]')).join('|')})`, 'g');
    return recipe.template.split(regex).filter(part => part);
  }, [recipe]);

  const handleCopy = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    if (finalPrompt && !Object.values(promptValues).some(v => !v)) {
        navigator.clipboard.writeText(finalPrompt).then(() => {
            setHasCopied(true);
            onCopy(element);
            setTimeout(() => setHasCopied(false), 2000);
        });
    }
  }, [finalPrompt, promptValues, onCopy]);

  const handleGenerateClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const element = event.currentTarget;
    onGenerate(element);
  };

  const allFieldsFilled = useMemo(() => recipe.placeholders.every(p => promptValues[p.key]), [promptValues, recipe.placeholders]);

  const handleRating = (rating: number) => {
    if (currentRating === 0) {
      setCurrentRating(rating);
      onRating(rating);
    }
  }
  
  useEffect(() => {
      setCurrentRating(0);
  }, [recipe.id, aiResponse]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <div className="flex justify-center mb-4">
            <BuildIcon className="w-16 h-16 text-purple-500" />
        </div>
        <h2 className="text-3xl font-extrabold mb-2">Construa o seu Prompt!</h2>
        <p className="text-lg text-slate-500 mb-8">Clique nos botões e escolha os "ingredientes" para a sua receita de prompt.</p>
        
        <div className="bg-white rounded-xl shadow-md p-6 min-h-[120px] flex items-center justify-center border">
            <p className="text-xl leading-relaxed text-slate-600 text-center">
            {promptParts.map((part, index) => {
                const placeholder = recipe.placeholders.find(p => p.key === part);
                if (placeholder) {
                return (
                    <span key={index} className="relative inline-block mx-1 group">
                        <select
                            value={promptValues[placeholder.key] || ''}
                            onChange={(e) => handleValueChange(placeholder.key, e.target.value)}
                            className={`appearance-none rounded-lg px-4 py-2 text-base font-semibold transition-all duration-200 shadow-sm cursor-pointer border
                            ${promptValues[placeholder.key]
                                ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 hover:border-purple-300'
                                : 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse-bright'
                            }`}
                        >
                            {placeholder.options.map(opt => <option key={String(opt)} value={String(opt)}>{String(opt)}</option>)}
                        </select>
                    </span>
                );
                }
                return <span key={index}>{part}</span>;
            })}
            </p>
        </div>
        {allFieldsFilled && (
          <p className="text-center text-sm text-purple-600 mt-4 font-semibold animate-fade-in">✨ Fantástico! O seu prompt está pronto a ser usado.</p>
        )}
      </div>
      
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
        <h3 className="font-bold text-lg text-purple-800">O seu prompt final:</h3>
        <p className={`text-slate-700 transition-opacity ${allFieldsFilled ? 'opacity-100' : 'opacity-50'}`}>
          {finalPrompt}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
                onClick={handleCopy}
                disabled={!allFieldsFilled}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
            >
                {hasCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
                {hasCopied ? 'Copiado!' : 'Copiar Prompt'}
            </button>
            <button
                onClick={handleGenerateClick}
                disabled={!allFieldsFilled || isLoading}
                className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 transition-all duration-300
                ${allFieldsFilled && !isLoading ? 'hover:bg-purple-700 animate-glow' : ''}
                disabled:bg-purple-300 disabled:text-purple-100 disabled:cursor-not-allowed`}
            >
                {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                {isLoading ? 'A gerar...' : 'Gerar com IA'}
            </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertTriangleIcon className="w-5 h-5"/>
            <p className="text-sm">{error}</p>
        </div>
      )}

      {(isLoading || aiResponse) && (
        <div className="bg-white rounded-xl shadow-md p-6 border animate-fade-in space-y-6">
            <div>
              <h3 className="font-bold text-lg text-purple-800 mb-4">Resposta da IA:</h3>
              {isLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-500 h-24">
                      <Spinner className="w-6 h-6 text-purple-500"/>
                      {isTakingLong ? (
                          <span className="text-center text-sm">A IA está a pensar... Os modelos gratuitos podem demorar um pouco a 'acordar'.<br/>Agradecemos a sua paciência!</span>
                      ) : (
                          <span>A IA está a {recipe.type === 'image' ? 'desenhar' : 'pensar'}...</span>
                      )}
                  </div>
              ) : recipe.type === 'image' ? (
                  <img src={aiResponse} alt="Imagem gerada por IA" className="rounded-lg shadow-md mx-auto" />
              ) : (
                  <div
                    className="prose prose-slate prose-p:text-slate-600 prose-strong:text-slate-700 prose-li:text-slate-600 prose-headings:text-slate-800 max-w-none whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatAIResponse(aiResponse) }}
                  />
              )}
            </div>

            {!isLoading && aiResponse && (
                <div className="text-center border-t border-slate-200 pt-6">
                    <p className="text-sm font-medium text-slate-600 mb-2">O que achou deste resultado?</p>
                    <StarRating rating={currentRating} onRating={handleRating} />
                    {currentRating > 0 && <p className="text-xs text-purple-600 mt-2">Obrigado pelo seu feedback!</p>}
                </div>
            )}
        </div>
      )}
      
      <div className={`mt-8 transition-opacity duration-500 ease-in-out ${aiResponse && recipe.type === 'text' && (isSuggestionLoading || promptSuggestion) ? 'opacity-100' : 'opacity-0'}`}>
        {aiResponse && recipe.type === 'text' && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <LightbulbIcon className="h-6 w-6 text-amber-500" />
                    </div>
                    <div className="ml-3">
                        <h3 className="font-bold text-amber-800">Dicas Avançadas</h3>
                        {isSuggestionLoading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                <Spinner className="w-4 h-4 text-amber-500" />
                                <span>A procurar dicas...</span>
                            </div>
                        ) : (
                            promptSuggestion && (
                                <div 
                                    className="mt-2 text-sm text-amber-700 prose prose-sm prose-strong:text-amber-800"
                                    dangerouslySetInnerHTML={{ __html: formatAIResponse(promptSuggestion) }}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PromptBuilder;
