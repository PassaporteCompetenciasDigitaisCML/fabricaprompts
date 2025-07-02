import React, { useMemo } from 'react';
import type { Recipe } from '../types';
import { DocumentIcon, RecipeBookIcon, StarIcon, MedalIcon } from './Icons';

const StarsDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <StarIcon
                key={i}
                className={`w-4 h-4 ${i < Math.round(rating) ? 'text-amber-400' : 'text-slate-300'}`}
            />
        ))}
        {rating > 0 && <span className="ml-1.5 text-xs text-slate-500 font-medium">{rating.toFixed(1)}</span>}
    </div>
);


const RecipeCard: React.FC<{ recipe: Recipe; onSelect: () => void; }> = ({ recipe, onSelect }) => {
    const averageRating = useMemo(() => {
        return recipe.voteCount > 0 ? recipe.totalScore / recipe.voteCount : 0;
    }, [recipe.totalScore, recipe.voteCount]);
    
    const isPopular = averageRating >= 4.0 && recipe.voteCount >= 3;

    return (
        <button
            onClick={onSelect}
            className="w-full h-full bg-white rounded-xl shadow-md p-5 text-left hover:bg-slate-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-50 flex flex-col"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start">
                    <div className="flex-shrink-0 text-purple-600 bg-purple-100 p-3 rounded-lg">
                        <DocumentIcon className="w-6 h-6" />
                    </div>
                    <div className="ml-4 flex-grow">
                        <h3 className="text-base font-bold text-slate-800">{recipe.title}</h3>
                        <p className="mt-1 text-sm text-slate-500 flex-grow">{recipe.description}</p>
                    </div>
                </div>
                 {isPopular && (
                    <div title={`Popular! ${averageRating.toFixed(1)} estrelas de ${recipe.voteCount} avaliações.`} className="flex-shrink-0 ml-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-bold leading-none text-amber-800 bg-amber-200 rounded-full shadow-sm">
                           <MedalIcon className="w-4 h-4 mr-1 text-amber-600" />
                           Popular
                        </span>
                    </div>
                 )}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
                <StarsDisplay rating={averageRating} />
            </div>
        </button>
    );
};


interface RecipeSelectorProps {
  recipes: Recipe[];
  categoryTitle: string;
  onSelect: (recipe: Recipe) => void;
}

const RecipeSelector: React.FC<RecipeSelectorProps> = ({ recipes, categoryTitle, onSelect }) => {
  return (
    <div className="animate-fade-in text-center">
      <div className="flex justify-center mb-4">
        <RecipeBookIcon className="w-16 h-16 text-purple-500" />
      </div>
      <h2 className="text-3xl font-extrabold mb-2">Receitas para <span className="text-purple-600">{categoryTitle}</span></h2>
      <p className="text-lg text-slate-500 mb-8">Agora, escolha uma "receita" para começar a construir o seu prompt.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} onSelect={() => onSelect(recipe)} />
        ))}
      </div>
    </div>
  );
};

export default RecipeSelector;