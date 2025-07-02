import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import type { Recipe, Category } from '../types';
import { CATEGORIES as staticCategoriesData, INITIAL_RECIPES as staticRecipesData } from '../constants';


// CONFIGURE AQUI AS SUAS CREDENCIAIS DA FIREBASE
// Substitua este objeto pelas credenciais do seu projeto Firebase
// Pode encontrá-las em: Configurações do Projeto > As suas apps > Configuração do SDK
const firebaseConfig = {
  apiKey: "AIzaSyCNE6q81fjBNsf3o9JWwuCzgh2tZvSFbaM",
  authDomain: "fabricapromptscml.firebaseapp.com",
  projectId: "fabricapromptscml",
  storageBucket: "fabricapromptscml.firebasestorage.app",
  messagingSenderId: "823692201885",
  appId: "1:823692201885:web:bfacf74a0db08a8808e974",
};

// Inicializar a Firebase
let app;
let db;

try {
  // Apenas inicializa a app se não houver credenciais de placeholder
  if (firebaseConfig.apiKey !== "SUA_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}


// Função para buscar dados da Firestore, com fallback para os dados estáticos se falhar
export async function getRecipesAndCategories(): Promise<{ 
  recipes: Record<string, Recipe>, 
  categories: Record<string, Category>,
  source: 'firestore' | 'fallback' 
}> {
  if (!db) {
    console.warn("Firebase not configured, using local fallback data.");
    return { recipes: staticRecipesData, categories: staticCategoriesData, source: 'fallback' };
  }

  try {
    const [recipesSnapshot, categoriesSnapshot] = await Promise.all([
      getDocs(collection(db, 'recipes')),
      getDocs(collection(db, 'categories'))
    ]);

    const recipes: Record<string, Recipe> = {};
    recipesSnapshot.forEach(doc => {
      recipes[doc.id] = { id: doc.id, ...doc.data() } as Recipe;
    });

    const categories: Record<string, Category> = {};
    categoriesSnapshot.forEach(doc => {
        const categoryData = doc.data() as Omit<Category, 'id' | 'icon'>;
        const staticCategory = Object.values(staticCategoriesData).find(c => c.id === doc.id);
        categories[doc.id] = { 
            id: doc.id, 
            ...categoryData,
            icon: staticCategory?.icon // Re-associa o ícone estático
        } as Category;
    });
    
    // Fallback: se não houver dados na firestore, usa os dados locais
    if (Object.keys(recipes).length === 0 || Object.keys(categories).length === 0) {
      console.warn("Firebase data is empty, using local fallback data.");
      return { recipes: staticRecipesData, categories: staticCategoriesData, source: 'fallback' };
    }

    return { recipes, categories, source: 'firestore' };
  } catch (error) {
    console.error("Error fetching data from Firestore, using local fallback:", error);
    // Em caso de erro (ex: config errada, sem internet), usa os dados locais para a app não quebrar
    return { recipes: staticRecipesData, categories: staticCategoriesData, source: 'fallback' };
  }
}

// Função para atualizar a avaliação de uma receita na Firestore
export async function updateRecipeRating(recipeId: string, rating: number): Promise<void> {
  if (!db) {
    console.warn("Cannot update rating, Firebase is not configured.");
    return;
  }
  try {
    const recipeRef = doc(db, 'recipes', recipeId);
    await updateDoc(recipeRef, {
      totalScore: increment(rating),
      voteCount: increment(1)
    });
  } catch (error) {
    console.error("Error updating rating in Firestore:", error);
    // Opcional: pode querer informar o utilizador que a avaliação falhou.
    // Por agora, o erro é apenas registado na consola.
  }
}
