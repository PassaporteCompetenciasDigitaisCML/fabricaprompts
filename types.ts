export type Option = string | number;

export interface Placeholder {
  key: string;
  label: string;
  options: Option[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  template: string;
  placeholders: Placeholder[];
  categoryId: string;
  type: 'text' | 'image';
  totalScore: number;
  voteCount: number;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  recipeIds: string[];
}