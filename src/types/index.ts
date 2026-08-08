// ===== 分类、口味、菜系、难度 =====
export type Category =
  | '面食' | '甜点' | '菌菇干货' | '豆制品' | '猪肉'
  | '牛羊肉' | '水产海鲜' | '汤品' | '凉菜' | '热炒'
  | '蒸菜' | '炖焖红烧' | '煎炸' | '汤羹' | '主食小吃'
  | '农家菜';

export type Taste = '清淡' | '酸辣' | '麻辣' | '酸甜' | '咸香' | '蒜香' | '酱香' | '鲜香';
export type Cuisine = '川菜' | '粤菜' | '鲁菜' | '苏菜' | '湘菜' | '家常菜' | '创意菜' | '融合菜' | '农家菜';
export type Difficulty = '简单' | '中等' | '困难';
export type MealType = '早餐' | '午餐' | '晚餐' | '加餐';
export type ChallengeType = '每日' | '主题' | '技能';

// ===== 食材 =====
export interface Ingredient {
  name: string;
  amount: string;
}

// ===== 烹饪步骤 =====
export interface RecipeStep {
  order: number;
  instruction: string;
  tip?: string;
  time?: number; // 该步骤需要的计时分钟数
}

// ===== 营养成分 =====
export interface Nutrition {
  calories: number;      // 千卡
  protein: number;       // 克
  fat: number;           // 克
  carbs: number;         // 克
  fiber: number;         // 克
}

// ===== 菜谱 =====
export interface Recipe {
  id: string;
  name: string;
  coverImage: string;
  coverEmoji: string;    // emoji 键名
  category: Category;
  taste: Taste[];
  cuisine: Cuisine;
  difficulty: Difficulty;
  prepTime: number;      // 准备时间（分钟）
  cookTime: number;      // 烹饪时间（分钟）
  totalTime: number;     // 总时长（分钟）
  servings: number;      // 默认份数
  ingredients: Ingredient[];
  seasonings: Ingredient[];
  steps: RecipeStep[];
  tips: string[];
  nutrition: Nutrition;
  tags: string[];
  isLowCalorie: boolean;
  isQuick: boolean;
  rating: number;        // 1-5
  cookCount: number;
}

// ===== 用户数据 =====
export interface DietRecord {
  id: string;
  date: string;          // YYYY-MM-DD
  recipeId: string;
  recipeName: string;
  servings: number;
  mealType: MealType;
  note?: string;
}

export interface RecipeNote {
  id: string;
  recipeId: string;
  recipeName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CookingTimer {
  id: string;
  label: string;
  duration: number;      // 秒
  startTime?: number;    // Date.now()
}

export interface ShoppingItem {
  name: string;
  amount: string;
  checked: boolean;
}

// ===== 挑战 =====
export interface ChallengeTask {
  id: string;
  title: string;
  description: string;
  recipeId?: string;
  completionCondition: string;
}

export interface Challenge {
  id: string;
  title: string;
  type: ChallengeType;
  difficulty: Difficulty;
  description: string;
  icon: string;          // emoji
  tasks: ChallengeTask[];
  reward: {
    points: number;
    badge: string;
  };
}

export interface UserChallengeProgress {
  challengeId: string;
  startTime: string;
  completedTasks: string[];  // task IDs
  completed: boolean;
}

// ===== 用户汇总 =====
export interface UserData {
  favorites: string[];
  notes: RecipeNote[];
  dietRecords: DietRecord[];
  timers: CookingTimer[];
  challengeProgress: UserChallengeProgress[];
  totalPoints: number;
  badges: string[];
  titles: string[];
  streak: number;
  lastCookDate: string;
}

// ===== 筛选条件 =====
export interface FilterOptions {
  keyword?: string;
  category?: Category | '全部';
  tastes?: Taste[];
  cuisine?: Cuisine;
  maxTime?: number;      // 最大总时长
  difficulty?: Difficulty;
  maxCalories?: number;
}

// ===== Toast =====
export interface ToastContextType {
  showToast: (message: string) => void;
}
