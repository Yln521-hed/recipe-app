import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import type { Category, Taste, Cuisine, Difficulty, FilterOptions } from '../types';
import { CATEGORIES, TASTES, CUISINES, DIFFICULTIES } from '../data/constants';
import { filterRecipes } from '../utils/helpers';

// ---------------------------------------------------------------------------
// Local constants
// ---------------------------------------------------------------------------

const TIME_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: 15, label: '15分钟内' },
  { value: 30, label: '30分钟内' },
  { value: 60, label: '60分钟内' },
  { value: undefined, label: '不限' },
];

const CALORIE_OPTIONS: { value: number | undefined; label: string }[] = [
  { value: 100, label: '≤100千卡' },
  { value: 200, label: '≤200千卡' },
  { value: 300, label: '≤300千卡' },
  { value: undefined, label: '不限' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtTime(min: number): string {
  if (min < 60) return `${min}分钟`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Categories() {
  const recipes = useRecipes();
  const navigate = useNavigate();

  // ---- state ----
  const [activeCategory, setActiveCategory] = useState<Category | '全部'>('全部');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedTastes, setSelectedTastes] = useState<Taste[]>([]);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | undefined>(undefined);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | undefined>(undefined);
  const [maxTime, setMaxTime] = useState<number | undefined>(undefined);
  const [maxCalories, setMaxCalories] = useState<number | undefined>(undefined);

  // ---- derived ----
  const filterOptions = useMemo<FilterOptions>(() => ({
    category: activeCategory,
    tastes: selectedTastes.length > 0 ? selectedTastes : undefined,
    cuisine: selectedCuisine,
    difficulty: selectedDifficulty,
    maxTime,
    maxCalories,
  }), [activeCategory, selectedTastes, selectedCuisine, selectedDifficulty, maxTime, maxCalories]);

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, filterOptions),
    [recipes, filterOptions],
  );

  const hasActiveFilters =
    activeCategory !== '全部' ||
    selectedTastes.length > 0 ||
    !!selectedCuisine ||
    !!selectedDifficulty ||
    maxTime !== undefined ||
    maxCalories !== undefined;

  const activeFilterCount = [
    ...selectedTastes,
    selectedCuisine,
    selectedDifficulty,
    maxTime,
    maxCalories,
  ].filter(Boolean).length;

  // ---- handlers ----
  const toggleTaste = (t: Taste) => {
    setSelectedTastes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
    );
  };

  const clearAll = () => {
    setActiveCategory('全部');
    setSelectedTastes([]);
    setSelectedCuisine(undefined);
    setSelectedDifficulty(undefined);
    setMaxTime(undefined);
    setMaxCalories(undefined);
  };

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <div className="page">
      {/* ================================================================
          1.  Category tabs
          ================================================================ */}
      <div className="category-tabs">
        <button
          className={`category-tabs__pill${
            activeCategory === '全部' ? ' category-tabs__pill--active' : ''
          }`}
          onClick={() => setActiveCategory('全部')}
        >
          🍽️ 全部
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            className={`category-tabs__pill${
              activeCategory === cat.value ? ' category-tabs__pill--active' : ''
            }`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* ================================================================
          2.  Filter toggle + clear-all
          ================================================================ */}
      <div style={{ padding: '0 var(--space-lg)', marginBottom: 'var(--space-sm)' }}>
        <button
          className="btn btn--outline btn--sm"
          onClick={() => setShowFilter(prev => !prev)}
        >
          🔍 筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
        {hasActiveFilters && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={clearAll}
            style={{ marginLeft: 8 }}
          >
            清除全部
          </button>
        )}
      </div>

      {/* ================================================================
          3.  Active filter tags
          ================================================================ */}
      {hasActiveFilters && (
        <div className="filter-panel__tags" style={{ padding: '0 var(--space-lg) var(--space-sm)' }}>
          {activeCategory !== '全部' && (
            <span className="filter-panel__tag">
              {activeCategory}
              <button onClick={() => setActiveCategory('全部')}>&times;</button>
            </span>
          )}
          {selectedTastes.map(t => (
            <span key={t} className="filter-panel__tag">
              {t}
              <button onClick={() => toggleTaste(t)}>&times;</button>
            </span>
          ))}
          {selectedCuisine && (
            <span className="filter-panel__tag">
              {selectedCuisine}
              <button onClick={() => setSelectedCuisine(undefined)}>&times;</button>
            </span>
          )}
          {selectedDifficulty && (
            <span className="filter-panel__tag">
              {selectedDifficulty}
              <button onClick={() => setSelectedDifficulty(undefined)}>&times;</button>
            </span>
          )}
          {maxTime !== undefined && (
            <span className="filter-panel__tag">
              ≤{maxTime}分钟
              <button onClick={() => setMaxTime(undefined)}>&times;</button>
            </span>
          )}
          {maxCalories !== undefined && (
            <span className="filter-panel__tag">
              ≤{maxCalories}千卡
              <button onClick={() => setMaxCalories(undefined)}>&times;</button>
            </span>
          )}
        </div>
      )}

      {/* ================================================================
          4.  Filter panel
          ================================================================ */}
      <div style={{ padding: '0 var(--space-lg)', marginBottom: 'var(--space-md)' }}>
        <div className={`filter-panel${showFilter ? ' filter-panel--open' : ''}`}>
          <div className="filter-panel__inner">
            {/* ---- 口味 ---- */}
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              口味
            </h4>
            <div className="filter-panel__grid" style={{ marginBottom: 16 }}>
              {TASTES.map(t => (
                <button
                  key={t.value}
                  className={`filter-panel__option${
                    selectedTastes.includes(t.value) ? ' filter-panel__option--selected' : ''
                  }`}
                  onClick={() => toggleTaste(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ---- 菜系 ---- */}
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              菜系
            </h4>
            <div className="filter-panel__grid" style={{ marginBottom: 16 }}>
              {CUISINES.map(c => (
                <button
                  key={c.value}
                  className={`filter-panel__option${
                    selectedCuisine === c.value ? ' filter-panel__option--selected' : ''
                  }`}
                  onClick={() =>
                    setSelectedCuisine(prev => (prev === c.value ? undefined : c.value))
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* ---- 难度 ---- */}
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              难度
            </h4>
            <div className="filter-panel__grid" style={{ marginBottom: 16 }}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.value}
                  className={`filter-panel__option${
                    selectedDifficulty === d.value ? ' filter-panel__option--selected' : ''
                  }`}
                  onClick={() =>
                    setSelectedDifficulty(prev => (prev === d.value ? undefined : d.value))
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* ---- 烹饪时长 ---- */}
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              烹饪时长
            </h4>
            <div className="filter-panel__grid" style={{ marginBottom: 16 }}>
              {TIME_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  className={`filter-panel__option${
                    maxTime === opt.value ? ' filter-panel__option--selected' : ''
                  }`}
                  onClick={() => setMaxTime(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* ---- 热量上限 ---- */}
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
              热量上限
            </h4>
            <div className="filter-panel__grid">
              {CALORIE_OPTIONS.map(opt => (
                <button
                  key={String(opt.value)}
                  className={`filter-panel__option${
                    maxCalories === opt.value ? ' filter-panel__option--selected' : ''
                  }`}
                  onClick={() => setMaxCalories(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================
          5.  Results count
          ================================================================ */}
      <div style={{ padding: '0 var(--space-lg)', marginBottom: 'var(--space-xs)' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          共 {filteredRecipes.length} 道菜
        </span>
      </div>

      {/* ================================================================
          6.  Recipe grid  /  empty state
          ================================================================ */}
      {filteredRecipes.length > 0 ? (
        <div className="recipe-grid">
          {filteredRecipes.map(recipe => (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => navigate(`/recipe/${recipe.id}`)}
            >
              <div className="recipe-card__cover">
                <img src={recipe.coverImage} alt={recipe.name} />
                <span className="recipe-card__badge badge">{recipe.difficulty}</span>
                <span className="recipe-card__time">
                  ⏱ {fmtTime(recipe.totalTime)}
                </span>
              </div>
              <div className="recipe-card__info">
                <div className="recipe-card__title">{recipe.name}</div>
                <div className="recipe-card__meta">
                  <span style={{ color: 'var(--color-warning)', letterSpacing: 1 }}>
                    {renderStars(recipe.rating)}
                  </span>
                  <span>{recipe.rating}</span>
                </div>
                {recipe.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {recipe.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state__emoji">🍳</div>
          <div className="empty-state__title">没有找到匹配的菜谱</div>
          <div className="empty-state__text">
            试试调整筛选条件，或者清除所有筛选重新浏览
          </div>
          <button
            className="btn btn--outline"
            style={{ marginTop: 16 }}
            onClick={clearAll}
          >
            清除全部筛选
          </button>
        </div>
      )}
    </div>
  );
}
