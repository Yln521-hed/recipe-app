import type { DietRecord, RecipeNote, CookingTimer, UserChallengeProgress } from '../types';
import { STORAGE_KEYS } from '../data/constants';
import { generateId, todayStr } from './helpers';

// ===== 通用读写 =====
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ===== 收藏 =====
export function getFavorites(): string[] {
  return getItem<string[]>(STORAGE_KEYS.FAVORITES, []);
}

export function toggleFavorite(recipeId: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(recipeId);
  if (idx >= 0) {
    favs.splice(idx, 1);
    setItem(STORAGE_KEYS.FAVORITES, favs);
    return false;
  } else {
    favs.push(recipeId);
    setItem(STORAGE_KEYS.FAVORITES, favs);
    return true;
  }
}

export function isFavorite(recipeId: string): boolean {
  return getFavorites().includes(recipeId);
}

// ===== 笔记 =====
export function getNotes(): RecipeNote[] {
  return getItem<RecipeNote[]>(STORAGE_KEYS.NOTES, []);
}

export function saveNote(recipeId: string, recipeName: string, content: string): RecipeNote {
  const notes = getNotes();
  const existing = notes.find((n) => n.recipeId === recipeId);
  const now = new Date().toISOString();
  if (existing) {
    existing.content = content;
    existing.updatedAt = now;
    setItem(STORAGE_KEYS.NOTES, notes);
    return existing;
  } else {
    const note: RecipeNote = {
      id: generateId(),
      recipeId,
      recipeName,
      content,
      createdAt: now,
      updatedAt: now,
    };
    notes.push(note);
    setItem(STORAGE_KEYS.NOTES, notes);
    return note;
  }
}

export function deleteNote(noteId: string): void {
  const notes = getNotes().filter((n) => n.id !== noteId);
  setItem(STORAGE_KEYS.NOTES, notes);
}

export function getNoteForRecipe(recipeId: string): RecipeNote | undefined {
  return getNotes().find((n) => n.recipeId === recipeId);
}

// ===== 饮食记录 =====
export function getDietRecords(): DietRecord[] {
  return getItem<DietRecord[]>(STORAGE_KEYS.DIET_RECORDS, []);
}

export function addDietRecord(
  recipeId: string,
  recipeName: string,
  servings: number,
  mealType: DietRecord['mealType'],
  note?: string
): DietRecord {
  const records = getDietRecords();
  const record: DietRecord = {
    id: generateId(),
    date: todayStr(),
    recipeId,
    recipeName,
    servings,
    mealType,
    note,
  };
  records.push(record);
  setItem(STORAGE_KEYS.DIET_RECORDS, records);
  updateStreak();
  return record;
}

export function getDietRecordsByDate(date: string): DietRecord[] {
  return getDietRecords().filter((r) => r.date === date);
}

// ===== 计时器 =====
export function getTimers(): CookingTimer[] {
  return getItem<CookingTimer[]>(STORAGE_KEYS.TIMERS, []);
}

export function saveTimer(label: string, duration: number): CookingTimer {
  const timers = getTimers();
  const timer: CookingTimer = {
    id: generateId(),
    label,
    duration,
  };
  timers.push(timer);
  setItem(STORAGE_KEYS.TIMERS, timers);
  return timer;
}

export function deleteTimer(timerId: string): void {
  const timers = getTimers().filter((t) => t.id !== timerId);
  setItem(STORAGE_KEYS.TIMERS, timers);
}

// ===== 挑战进度 =====
export function getChallengeProgress(): UserChallengeProgress[] {
  return getItem<UserChallengeProgress[]>(STORAGE_KEYS.CHALLENGE_PROGRESS, []);
}

export function saveChallengeProgress(progress: UserChallengeProgress): void {
  const all = getChallengeProgress();
  const idx = all.findIndex((p) => p.challengeId === progress.challengeId);
  if (idx >= 0) {
    all[idx] = progress;
  } else {
    all.push(progress);
  }
  setItem(STORAGE_KEYS.CHALLENGE_PROGRESS, all);
}

// ===== 积分 =====
export function getPoints(): number {
  return getItem<number>(STORAGE_KEYS.POINTS, 0);
}

export function addPoints(pts: number): number {
  const total = getPoints() + pts;
  setItem(STORAGE_KEYS.POINTS, total);
  return total;
}

// ===== 徽章 =====
export function getBadges(): string[] {
  return getItem<string[]>(STORAGE_KEYS.BADGES, []);
}

export function addBadge(badge: string): void {
  const badges = getBadges();
  if (!badges.includes(badge)) {
    badges.push(badge);
    setItem(STORAGE_KEYS.BADGES, badges);
  }
}

// ===== 连续打卡 =====
export function getStreak(): { streak: number; lastCookDate: string } {
  return getItem<{ streak: number; lastCookDate: string }>(STORAGE_KEYS.STREAK, { streak: 0, lastCookDate: '' });
}

function updateStreak(): void {
  const data = getStreak();
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (data.lastCookDate === today) return; // 今天已打过卡

  if (data.lastCookDate === yesterday) {
    data.streak += 1;
  } else if (data.lastCookDate !== today) {
    data.streak = 1;
  }
  data.lastCookDate = today;
  setItem(STORAGE_KEYS.STREAK, data);
}

// ===== 自定义封面图 =====
export function getCoverImages(): Record<string, string> {
  return getItem<Record<string, string>>(STORAGE_KEYS.COVER_IMAGES, {});
}

export function setCoverImage(recipeId: string, url: string): void {
  const images = getCoverImages();
  images[recipeId] = url;
  setItem(STORAGE_KEYS.COVER_IMAGES, images);
}
