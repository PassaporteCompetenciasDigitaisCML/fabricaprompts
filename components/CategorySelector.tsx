import React from 'react';
import type { Category } from '../types';
import { StartIcon } from './Icons';

interface CategoryCardProps {
  category: Category;
  onSelect: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onSelect }) => (
  <button
    onClick={onSelect}
    className="w-full h-full bg-white rounded-xl shadow-md p-6 text-left hover:bg-slate-50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-50 flex flex-col"
  >
    <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg w-fit">
      {category.icon}
    </div>
    <div className="mt-4 flex-grow">
      <h3 className="text-lg font-bold text-slate-800">{category.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{category.description}</p>
    </div>
  </button>
);


interface CategorySelectorProps {
  categories: Category[];
  onSelect: (category: Category) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ categories, onSelect }) => {
  return (
    <div className="animate-fade-in text-center">
      <div className="flex justify-center mb-4">
          <StartIcon className="w-16 h-16 text-purple-500" />
      </div>
      <h2 className="text-3xl font-extrabold mb-2 text-slate-900">Comece por aqui!</h2>
      <p className="text-lg text-slate-500 mb-8">Escolha uma categoria para ver as "receitas" de prompts disponíveis.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <CategoryCard key={category.id} category={category} onSelect={() => onSelect(category)} />
        ))}
      </div>
    </div>
  );
};

export default CategorySelector;