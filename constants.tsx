import React from 'react';
import type { Category, Recipe } from './types';
import { LightbulbIcon, MailIcon, ImageIcon } from './components/Icons';

// Este ficheiro agora contém apenas os ícones e os dados de fallback,
// caso a ligação à Firebase falhe. A fonte principal de dados é a Firestore.

const ICONS: Record<string, React.ReactNode> = {
  lightbulb: <LightbulbIcon className="w-8 h-8 text-purple-500" />,
  mail: <MailIcon className="w-8 h-8 text-purple-500" />,
  image: <ImageIcon className="w-8 h-8 text-purple-500" />
};

// Dados de Fallback (usados apenas se a Firebase estiver indisponível)
const rawRecipes = [
  { id: 'ideias-projeto', categoryId: 'gerar-ideias', title: 'Brainstorm para Projetos', description: 'Gere ideias para novos projetos criativos ou profissionais.', template: 'Cria uma lista de [numero] ideias criativas para um novo [projeto] com um tom [tom].', type: 'text', totalScore: 28, voteCount: 7, placeholders: [{ key: '[numero]', label: 'Número de ideias', options: ['3','5','10'] },{ key: '[projeto]', label: 'Tipo de projeto', options: ['podcast','vídeo para o YouTube','artigo de blog'] },{ key: '[tom]', label: 'Estilo', options: ['profissional','divertido','inspirador'] }] },
  { id: 'imagem-fantasia', categoryId: 'criar-imagens', title: 'Cenário de Fantasia', description: 'Crie uma imagem de um mundo mágico e fantástico.', template: 'Uma pintura digital de um [cenario] fantástico, com [elemento_principal] em destaque. Estilo de [artista].', type: 'image', totalScore: 55, voteCount: 12, placeholders: [{ key: '[cenario]', label: 'Cenário', options: ['castelo flutuante','floresta encantada'] },{ key: '[elemento_principal]', label: 'Elemento Principal', options: ['um dragão majestoso','um feiticeiro poderoso'] },{ key: '[artista]', label: 'Estilo de Artista', options: ['fantasia épica','anime'] }] }
] as const;

const rawCategories = [
  { id: 'gerar-ideias', title: 'Gerar Ideias', description: 'Para quando precisa de inspiração.', iconName: 'lightbulb', recipeIds: ['ideias-projeto'] },
  { id: 'criar-imagens', title: 'Criar Imagens', description: 'Transforme texto em imagens.', iconName: 'image', recipeIds: ['imagem-fantasia'] }
];

// Processar dados de fallback
const fallbackRecipes = rawRecipes.reduce((acc, recipe) => {
  acc[recipe.id] = recipe as any;
  return acc;
}, {} as Record<string, Recipe>);

const fallbackCategories = rawCategories.reduce((acc, category) => {
    acc[category.id] = {
        ...category,
        icon: ICONS[category.iconName],
    };
    return acc;
}, {} as Record<string, Category>);


export const INITIAL_RECIPES = fallbackRecipes;
export const CATEGORIES = fallbackCategories;
