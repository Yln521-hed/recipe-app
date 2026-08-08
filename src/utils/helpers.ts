import type { Ingredient, Nutrition, Recipe, FilterOptions } from '../types';

/** 按比例换算食材用量 */
export function scaleIngredient(
  ingredient: Ingredient,
  originalServings: number,
  targetServings: number
): Ingredient {
  const ratio = targetServings / originalServings;
  // 匹配中文数字和阿拉伯数字
  const match = ingredient.amount.match(/^([\d.]+)\s*(.*)$/);
  if (match) {
    const num = parseFloat(match[1]) * ratio;
    const rounded = num >= 10 ? Math.round(num) : Math.round(num * 10) / 10;
    return {
      name: ingredient.name,
      amount: `${rounded}${match[2]}`,
    };
  }
  // 尝试匹配全角数字
  const cnMatch = ingredient.amount.match(/^([一二三四五六七八九十百千万]+)\s*(.*)$/);
  if (cnMatch) {
    const cnNum = parseChineseNumber(cnMatch[1]) * ratio;
    const rounded = cnNum >= 10 ? Math.round(cnNum) : Math.round(cnNum * 10) / 10;
    return {
      name: ingredient.name,
      amount: `${rounded}${cnMatch[2]}`,
    };
  }
  // 无法解析，在量词前加"约"
  return {
    name: ingredient.name,
    amount: `约${ingredient.amount}`,
  };
}

/** 中文数字转阿拉伯数字（简单版） */
function parseChineseNumber(s: string): number {
  const map: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '百': 100, '千': 1000, '万': 10000,
  };
  if (s === '十') return 10;
  if (s.length === 1) return map[s] || 1;
  let result = 0;
  let current = 0;
  for (const ch of s) {
    const v = map[ch];
    if (v === undefined) continue;
    if (v >= 10) {
      current = (current || 1) * v;
      result += current;
      current = 0;
    } else {
      current = v;
    }
  }
  result += current;
  return result || 1;
}

/** 按比例换算营养成分 */
export function scaleNutrition(
  nutrition: Nutrition,
  originalServings: number,
  targetServings: number
): Nutrition {
  const ratio = targetServings / originalServings;
  return {
    calories: Math.round(nutrition.calories * ratio),
    protein: Math.round(nutrition.protein * ratio * 10) / 10,
    fat: Math.round(nutrition.fat * ratio * 10) / 10,
    carbs: Math.round(nutrition.carbs * ratio * 10) / 10,
    fiber: Math.round(nutrition.fiber * ratio * 10) / 10,
  };
}

/** 筛选菜谱 */
export function filterRecipes(recipes: Recipe[], options: FilterOptions): Recipe[] {
  return recipes.filter((r) => {
    // 关键词搜索
    if (options.keyword) {
      const kw = options.keyword.toLowerCase();
      const haystack = [
        r.name,
        ...r.tags,
        ...r.ingredients.map((i) => i.name),
        ...r.seasonings.map((s) => s.name),
        r.category,
      ].join(' ').toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    // 分类
    if (options.category && options.category !== '全部') {
      if (r.category !== options.category) return false;
    }
    // 口味（多选，满足任一即可）
    if (options.tastes && options.tastes.length > 0) {
      if (!options.tastes.some((t) => r.taste.includes(t))) return false;
    }
    // 菜系
    if (options.cuisine && r.cuisine !== options.cuisine) return false;
    // 最大时长
    if (options.maxTime && r.totalTime > options.maxTime) return false;
    // 难度
    if (options.difficulty && r.difficulty !== options.difficulty) return false;
    // 最大热量
    if (options.maxCalories && r.nutrition.calories > options.maxCalories) return false;
    return true;
  });
}

/** 生成唯一 ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** 格式化时长 */
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

/** 格式化热量 */
export function formatCalories(cal: number): string {
  return `${cal}千卡`;
}

/** 格式化日期 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return dateStr;
}

/** 获取今天的日期字符串 */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
