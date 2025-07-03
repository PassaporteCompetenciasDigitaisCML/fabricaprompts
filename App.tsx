import React, { useState, useMemo, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { UICategory, Recipe } from './types';
import Header from './components/Header';
import CategorySelector from './components/CategorySelector';
import RecipeSelector from './components/RecipeSelector';
import PromptBuilder from './components/PromptBuilder';
import { ArrowLeftIcon, AlertTriangleIcon } from './components/Icons';
import { generateContentWithGemini, generatePromptSuggestion, generateImageWithGemini } from './services/geminiService';
import { getRecipesAndCategories, updateRecipeRating } from './services/firebaseService';
import Spinner from './components/Spinner';

export type AppState = 'selecting_category' | 'selecting_recipe' | 'building_prompt';
type AppPhase = 'welcome' | 'main';
type DataStatus = 'loading' | 'loaded' | 'error';
type DataSource = 'firestore' | 'fallback';

const welcomeMessages = [
  "Hoje é um ótimo dia para criar algo incrível. Vamos começar?",
  "A criatividade começa com um bom prompt. Pronto para construir o seu?",
  "Desbloqueie o poder da IA. A sua jornada começa com um clique.",
  "Cada prompt é uma porta para um novo mundo. Qual vamos abrir hoje?",
  "Transforme ideias em realidade. Vamos fabricar o prompt perfeito!"
];

const App: React.FC = () => {
  const [appPhase, setAppPhase] = useState<AppPhase>('welcome');
  const [welcomeMessage] = useState(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
  
  const [dataStatus, setDataStatus] = useState<DataStatus>('loading');
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({});
  const [categories, setCategories] = useState<Record<string, UICategory>>({});

  const [selectedCategory, setSelectedCategory] = useState<UICategory | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  const [promptValues, setPromptValues] = useState<Record<string, string>>({});
  const [finalPrompt, setFinalPrompt] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  const [promptSuggestion, setPromptSuggestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTakingLong, setIsTakingLong] = useState<boolean>(false); // <-- NOVO ESTADO
  const [isSuggestionLoading, setIsSuggestionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      // Define um timer para mostrar a mensagem de paciência após 4 segundos
      timer = setTimeout(() => {
        setIsTakingLong(true);
      }, 4000);
    } else {
      setIsTakingLong(false);
    }
    return () => clearTimeout(timer); // Limpa o timer se a resposta chegar antes
  }, [isLoading]);

  useEffect(() => {
    async function loadData() {
      setDataStatus('loading');
      try {
        const { recipes, categories, source } = await getRecipesAndCategories();
        setRecipes(recipes);
        setCategories(categories);
        setDataSource(source);
        setDataStatus('loaded');
      } catch (e) {
        console.error("Failed to load app data:", e);
        setDataStatus('error');
      }
    }
    loadData();
  }, []);

  const appState: AppState = useMemo(() => {
    if (!selectedCategory) return 'selecting_category';
    if (!selectedRecipe) return 'selecting_recipe';
    return 'building_prompt';
  }, [selectedCategory, selectedRecipe]);

  const triggerConfetti = (element: HTMLElement | null) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const origin = {
        x: (rect.left + rect.right) / 2 / window.innerWidth,
        y: (rect.top + rect.bottom) / 2 / window.innerHeight
    };
    confetti({
        particleCount: 100,
        spread: 70,
        origin: origin,
        zIndex: 9999
    });
  };
  
  const handleSelectCategory = useCallback((category: UICategory) => {
    setSelectedCategory(category);
    setPromptValues({});
    setFinalPrompt('');
    setAiResponse('');
    setPromptSuggestion('');
    setError(null);
  }, []);

  const handleSelectRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    const initialValues: Record<string, string> = {};
    recipe.placeholders.forEach(p => {
      if (p.options && p.options.length > 0) {
          initialValues[p.key] = String(p.options[0]);
      } else {
          initialValues[p.key] = '';
      }
    });
    setPromptValues(initialValues);
    setAiResponse('');
    setPromptSuggestion('');
    setError(null);
  }, []);
  
  const handleBack = () => {
    if (appState === 'building_prompt') {
      setSelectedRecipe(null);
      setAiResponse('');
      setPromptSuggestion('');
    } else if (appState === 'selecting_recipe') {
      setSelectedCategory(null);
    }
    setError(null);
  };
  
  const handleGenerate = async (element: HTMLElement) => {
    if (!finalPrompt || !selectedRecipe) {
      setError("Ocorreu um erro. A receita do prompt não foi encontrada.");
      return;
    }
    if (Object.values(promptValues).some(v => !v)) {
      setError("Por favor, preencha todos os campos do prompt.");
      return;
    }
    setError(null);
    setIsLoading(true);
    setAiResponse('');
    setPromptSuggestion('');

    try {
      let response: string;
      if (selectedRecipe.type === 'image') {
        response = await generateImageWithGemini(finalPrompt);
      } else {
        response = await generateContentWithGemini(finalPrompt);
      }
      setAiResponse(response);
      triggerConfetti(element);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
      setError(`Falha ao gerar conteúdo: ${errorMessage}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      if (aiResponse && selectedRecipe?.type === 'text' && !isLoading) {
          setIsSuggestionLoading(true);
          generatePromptSuggestion(finalPrompt)
              .then(suggestion => {
                setPromptSuggestion(suggestion);
              })
              .catch(e => {
                  console.error("Could not fetch prompt suggestion:", e);
                  setPromptSuggestion("Não foi possível carregar uma dica neste momento.");
              })
              .finally(() => {
                  setIsSuggestionLoading(false)
              });
      }
  }, [aiResponse, isLoading, finalPrompt, selectedRecipe]);

  const handleRating = (recipeId: string, rating: number) => {
      setRecipes(prevRecipes => {
          const updatedRecipe = { ...prevRecipes[recipeId] };
          updatedRecipe.totalScore += rating;
          updatedRecipe.voteCount += 1;
          return { ...prevRecipes, [recipeId]: updatedRecipe };
      });
      if (dataSource === 'firestore') {
        updateRecipeRating(recipeId, rating);
      }
  };
  
  if (appPhase === 'welcome') {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="splash-screen">
                <img 
                    src="https://cloud1.email2go.io/97fc9b260a90d9c0aca468d2e6536980/f051a438712e1ebf0ff5922d0404f590ed495653ad4c5d621a9c8c3584330255.png" 
                    alt="Ilustração de um robô amigável a mexer num computador" 
                    className="w-48 h-48 mx-auto mb-6"
                />
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4">Bem-vindo à Fábrica de Prompts!</h1>
                <p className="text-slate-500 text-lg max-w-xl mx-auto mb-8">{welcomeMessage}</p>
                <button
                    onClick={() => setAppPhase('main')}
                    className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
                >
                    Iniciar
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header appState={appState} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {dataSource === 'fallback' && (
            <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 rounded-md mb-8" role="alert">
              <div className="flex items-center">
                  <AlertTriangleIcon className="h-6 w-6 mr-3"/>
                  <div>
                      <p className="font-bold">Modo Offline</p>
                      <p className="text-sm">Não foi possível ligar à base de dados. As avaliações não serão guardadas.</p>
                  </div>
              </div>
            </div>
        )}
        <div className="max-w-4xl mx-auto">
          {dataStatus === 'loading' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <Spinner className="w-12 h-12 text-purple-600"/>
                <p className="text-slate-500">A carregar a fábrica de prompts...</p>
            </div>
          )}
          {dataStatus === 'error' && (
              <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                  <h2 className="text-xl font-bold text-red-700">Ocorreu um erro</h2>
                  <p className="text-red-600 mt-2">Não foi possível carregar os dados da aplicação. Por favor, tente recarregar a página.</p>
              </div>
          )}
          {dataStatus === 'loaded' && (
            <>
              <div className="mb-12 flex items-center min-h-[4rem]">
                {appState !== 'selecting_category' ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Voltar
                  </button>
                ) : <div/>}
              </div>

              {appState === 'selecting_category' && (
                <CategorySelector
                  categories={Object.values(categories)}
                  onSelect={handleSelectCategory}
                />
              )}

              {appState === 'selecting_recipe' && selectedCategory && (
                <RecipeSelector
                  recipes={selectedCategory.recipeIds.map(id => recipes[id]).filter(Boolean)}
                  categoryTitle={selectedCategory.title}
                  onSelect={handleSelectRecipe}
                />
              )}

              {appState === 'building_prompt' && selectedRecipe && (
                <PromptBuilder
                  recipe={selectedRecipe}
                  promptValues={promptValues}
                  setPromptValues={setPromptValues}
                  finalPrompt={finalPrompt}
                  setFinalPrompt={setFinalPrompt}
                  aiResponse={aiResponse}
                  promptSuggestion={promptSuggestion}
                  isLoading={isLoading}
                  isTakingLong={isTakingLong} // <-- PASSA O NOVO ESTADO
                  isSuggestionLoading={isSuggestionLoading}
                  error={error}
                  onGenerate={handleGenerate}
                  onCopy={triggerConfetti}
                  onRating={(rating) => handleRating(selectedRecipe.id, rating)}
                />
              )}
            </>
          )}
        </div>
      </main>
      <footer className="text-center p-6 mt-8 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <img src="https://cloud1.email2go.io/97fc9b260a90d9c0aca468d2e6536980/3cf25b01b8221e9ef2cc66bbf03b81e0488e5293d4c6806f1ad979fcd92933b6.png" alt="Logótipo Passaporte Competências Digitais" className="h-12" />
            <p className="text-slate-500 text-sm max-w-sm">Uma ferramenta de aprendizagem do Passaporte Competências Digitais da Câmara Municipal de Lisboa.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
