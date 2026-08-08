import type { Recipe } from '../types';

export interface MatchResult {
  recipe: Recipe;
  matchRate: number;     // 0-1
  matchedIngredients: string[];
  missingIngredients: string[];
}

/** 冰箱食材匹配菜谱 */
export function matchRecipesByFridge(
  fridgeItems: string[],
  recipes: Recipe[]
): MatchResult[] {
  const normalizedFridge = fridgeItems.map((s) => s.trim().toLowerCase()).filter(Boolean);
  const results: MatchResult[] = [];

  for (const recipe of recipes) {
    const allRecipeItems = [
      ...recipe.ingredients.map((i) => i.name.toLowerCase()),
      ...recipe.seasonings.map((s) => s.name.toLowerCase()),
    ];
    const matched: string[] = [];
    const missing: string[] = [];

    for (const item of allRecipeItems) {
      const found = normalizedFridge.some(
        (f) => item.includes(f) || f.includes(item)
      );
      if (found) {
        matched.push(item);
      } else {
        missing.push(item);
      }
    }

    const matchRate = allRecipeItems.length > 0
      ? matched.length / allRecipeItems.length
      : 0;

    if (matchRate > 0) {
      results.push({ recipe, matchRate, matchedIngredients: matched, missingIngredients: missing });
    }
  }

  return results.sort((a, b) => b.matchRate - a.matchRate);
}

/** 剩菜改造匹配（阈值更低） */
export function matchLeftoverTransform(
  fridgeItems: string[],
  recipes: Recipe[]
): MatchResult[] {
  const results = matchRecipesByFridge(fridgeItems, recipes);
  return results
    .filter((r) => r.matchRate >= 0.1)
    .sort((a, b) => b.matchRate - a.matchRate)
    .slice(0, 10);
}
