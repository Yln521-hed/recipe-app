import { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { recipes as rawRecipes } from '../data/recipes';

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
    // 加载 Unsplash 实物图片
    fetch('/recipe-app/recipe-images.json')
      .then((res) => res.json())
      .then((images: Record<string, { url: string; desc: string }>) => {
        const updated = cachedRecipes.map((r) => ({
          ...r,
          coverImage: images[r.id]?.url || EMPTY_SVG,
        }));
        setRecipes(updated);
      })
      .catch(() => {
        // 图片加载失败，用默认封面
        setRecipes(cachedRecipes);
      });
  }, []);

  return recipes;
}
