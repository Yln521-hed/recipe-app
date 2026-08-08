import { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { recipes as rawRecipes } from '../data/recipes';

// 纯色占位图 —— 零复杂逻辑，确保不崩溃
const EMPTY_SVG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#FFF8F0" rx="12"/></svg>'
);

const cachedRecipes: Recipe[] = rawRecipes
  .filter((r): r is NonNullable<typeof r> => r != null)
  .map((r) => ({
    ...r,
    coverImage: EMPTY_SVG,
  }));

export function useRecipes(): Recipe[] {
  const [recipes, setRecipes] = useState<Recipe[]>(cachedRecipes);

  useEffect(() => {
    setRecipes(cachedRecipes);
  }, []);

  return recipes;
}
