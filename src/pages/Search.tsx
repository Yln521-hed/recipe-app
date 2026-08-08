import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { filterRecipes, formatTime } from '../utils/helpers';
import type { FilterOptions, Taste, Cuisine, Difficulty, Category } from '../types';

// =============================================================================
// Constants
// =============================================================================

const HOT_SEARCH_KEYWORDS = [
  '番茄炒蛋',
  '红烧肉',
  '麻婆豆腐',
  '宫保鸡丁',
  '鱼香肉丝',
  '酸辣土豆丝',
  '回锅肉',
  '清蒸鲈鱼',
];

const TASTES: Taste[] = ['清淡', '酸辣', '麻辣', '酸甜', '咸香', '蒜香', '酱香', '鲜香'];
const CUISINES: Cuisine[] = ['川菜', '粤菜', '鲁菜', '苏菜', '湘菜', '家常菜', '创意菜', '融合菜'];
const DIFFICULTIES: Difficulty[] = ['简单', '中等', '困难'];
const CATEGORIES: Category[] = [
  '面食', '甜点', '菌菇干货', '豆制品', '猪肉',
  '牛羊肉', '水产海鲜', '汤品', '凉菜', '热炒',
  '蒸菜', '炖焖红烧', '煎炸', '汤羹', '主食小吃',
];

const MAX_TIME_OPTIONS = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '45分钟', value: 45 },
  { label: '60分钟', value: 60 },
  { label: '90分钟', value: 90 },
  { label: '120分钟', value: 120 },
];

const MAX_CALORIES_OPTIONS = [
  { label: '100千卡', value: 100 },
  { label: '200千卡', value: 200 },
  { label: '300千卡', value: 300 },
  { label: '400千卡', value: 400 },
  { label: '500千卡', value: 500 },
  { label: '800千卡', value: 800 },
];

// =============================================================================
// Filter Panel Sub-component
// =============================================================================

interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange, onClose }) => {
  const update = (patch: Partial<FilterOptions>) => {
    onChange({ ...filters, ...patch });
  };

  const toggleTaste = (t: Taste) => {
    const current = filters.tastes || [];
    const next = current.includes(t) ? current.filter((v) => v !== t) : [...current, t];
    update({ tastes: next.length > 0 ? next : undefined });
  };

  return (
    <div style={styles.filterOverlay}>
      <div style={styles.filterPanel}>
        <div style={styles.filterHeader}>
          <span style={styles.filterTitle}>筛选条件</span>
          <button
            style={styles.filterResetBtn}
            onClick={() =>
              onChange({ keyword: filters.keyword })
            }
          >
            重置
          </button>
        </div>

        {/* Category */}
        <div style={styles.filterSection}>
          <div style={styles.filterLabel}>分类</div>
          <div style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                style={{
                  ...styles.filterChip,
                  ...(filters.category === cat ? styles.filterChipActive : {}),
                }}
                onClick={() =>
                  update({ category: filters.category === cat ? undefined : cat })
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tastes */}
        <div style={styles.filterSection}>
          <div style={styles.filterLabel}>口味</div>
          <div style={styles.chipRow}>
            {TASTES.map((t) => (
              <button
                key={t}
                style={{
                  ...styles.filterChip,
                  ...((filters.tastes || []).includes(t) ? styles.filterChipActive : {}),
                }}
                onClick={() => toggleTaste(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine */}
        <div style={styles.filterSection}>
          <div style={styles.filterLabel}>菜系</div>
          <div style={styles.chipRow}>
            {CUISINES.map((c) => (
              <button
                key={c}
                style={{
                  ...styles.filterChip,
                  ...(filters.cuisine === c ? styles.filterChipActive : {}),
                }}
                onClick={() =>
                  update({ cuisine: filters.cuisine === c ? undefined : c })
                }
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div style={styles.filterSection}>
          <div style={styles.filterLabel}>难度</div>
          <div style={styles.chipRow}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                style={{
                  ...styles.filterChip,
                  ...(filters.difficulty === d ? styles.filterChipActive : {}),
                }}
                onClick={() =>
                  update({ difficulty: filters.difficulty === d ? undefined : d })
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Max Time */}
        <div style={styles.filterSection}>
          <div style={styles.filterLabel}>最长时间</div>
          <div style={styles.chipRow}>
            {MAX_TIME_OPTIONS.map((o) => (
              <button
                key={o.value}
                style={{
                  ...styles.filterChip,
                  ...(filters.maxTime === o.value ? styles.filterChipActive : {}),
                }}
                onClick={() =>
                  update({ maxTime: filters.maxTime === o.value ? undefined : o.value })
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Calories */}
        <div style={styles.filterSection}>
          <div style={styles.filterLabel}>最大热量</div>
          <div style={styles.chipRow}>
            {MAX_CALORIES_OPTIONS.map((o) => (
              <button
                key={o.value}
                style={{
                  ...styles.filterChip,
                  ...(filters.maxCalories === o.value ? styles.filterChipActive : {}),
                }}
                onClick={() =>
                  update({
                    maxCalories: filters.maxCalories === o.value ? undefined : o.value,
                  })
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Done button */}
        <button style={styles.doneBtn} onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// Active Filter Tags
// =============================================================================

interface ActiveTagsProps {
  filters: FilterOptions;
  onRemoveKeyword: () => void;
  onRemoveCategory: () => void;
  onRemoveTaste: (t: Taste) => void;
  onRemoveCuisine: () => void;
  onRemoveDifficulty: () => void;
  onRemoveMaxTime: () => void;
  onRemoveMaxCalories: () => void;
  onClearAll: () => void;
}

const ActiveTags: React.FC<ActiveTagsProps> = ({
  filters,
  onRemoveKeyword,
  onRemoveCategory,
  onRemoveTaste,
  onRemoveCuisine,
  onRemoveDifficulty,
  onRemoveMaxTime,
  onRemoveMaxCalories,
  onClearAll,
}) => {
  const hasAny =
    !!filters.keyword ||
    !!filters.category ||
    (filters.tastes && filters.tastes.length > 0) ||
    !!filters.cuisine ||
    !!filters.difficulty ||
    !!filters.maxTime ||
    !!filters.maxCalories;

  if (!hasAny) return null;

  return (
    <div style={styles.activeTagsRow}>
      {filters.keyword && (
        <span style={styles.activeTag}>
          🔍 {filters.keyword}
          <span style={styles.tagClose} onClick={onRemoveKeyword}>
            ✕
          </span>
        </span>
      )}
      {filters.category && (
        <span style={styles.activeTag}>
          {filters.category}
          <span style={styles.tagClose} onClick={onRemoveCategory}>
            ✕
          </span>
        </span>
      )}
      {(filters.tastes || []).map((t) => (
        <span key={t} style={styles.activeTag}>
          {t}
          <span style={styles.tagClose} onClick={() => onRemoveTaste(t)}>
            ✕
          </span>
        </span>
      ))}
      {filters.cuisine && (
        <span style={styles.activeTag}>
          {filters.cuisine}
          <span style={styles.tagClose} onClick={onRemoveCuisine}>
            ✕
          </span>
        </span>
      )}
      {filters.difficulty && (
        <span style={styles.activeTag}>
          {filters.difficulty}
          <span style={styles.tagClose} onClick={onRemoveDifficulty}>
            ✕
          </span>
        </span>
      )}
      {filters.maxTime && (
        <span style={styles.activeTag}>
          {filters.maxTime}分钟内
          <span style={styles.tagClose} onClick={onRemoveMaxTime}>
            ✕
          </span>
        </span>
      )}
      {filters.maxCalories && (
        <span style={styles.activeTag}>
          {'<'}
          {filters.maxCalories}千卡
          <span style={styles.tagClose} onClick={onRemoveMaxCalories}>
            ✕
          </span>
        </span>
      )}
    </div>
  );
};

// =============================================================================
// Recipe Card
// =============================================================================

const RecipeCard: React.FC<{ recipe: import('../types').Recipe }> = ({ recipe }) => {
  const navigate = useNavigate();

  const stars = '★'.repeat(Math.round(recipe.rating)) + '☆'.repeat(5 - Math.round(recipe.rating));

  return (
    <div
      style={styles.card}
      onClick={() => navigate(`/recipe/${recipe.id}`)}
    >
      <div style={styles.cardImage}>
        {recipe.coverImage ? (
          <img src={recipe.coverImage} alt={recipe.name} style={styles.cardImg} />
        ) : (
          <span style={styles.cardEmoji}>{recipe.coverEmoji || '🍳'}</span>
        )}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardName}>{recipe.name}</div>
        <div style={styles.cardMeta}>
          <span style={styles.cardCategory}>{recipe.category}</span>
          <span style={styles.cardDifficulty}>{recipe.difficulty}</span>
        </div>
        <div style={styles.cardFooter}>
          <span style={styles.cardTime}>⏱ {formatTime(recipe.totalTime)}</span>
          <span style={styles.cardRating}>{stars}</span>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Search Page
// =============================================================================

const Search: React.FC = () => {
  const navigate = useNavigate();
  const recipes = useRecipes();

  const [keyword, setKeyword] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});

  // Merge keyword into filters for filtering
  const mergedFilters: FilterOptions = useMemo(
    () => ({
      ...filters,
      keyword: keyword.trim() || undefined,
    }),
    [filters, keyword],
  );

  const results = useMemo(
    () => filterRecipes(recipes, mergedFilters),
    [recipes, mergedFilters],
  );

  const hasActiveFilters =
    !!keyword.trim() ||
    !!filters.category ||
    (filters.tastes && filters.tastes.length > 0) ||
    !!filters.cuisine ||
    !!filters.difficulty ||
    !!filters.maxTime ||
    !!filters.maxCalories;

  const showHotSearch = !hasActiveFilters;

  // Handlers
  const handleSearch = (kw: string) => {
    setKeyword(kw);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setKeyword('');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>搜索菜谱</h1>
      </div>

      {/* Search Bar */}
      <div style={styles.searchBarRow}>
        <div style={styles.searchInputWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="搜索菜谱、食材、口味..."
            value={keyword}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {keyword && (
            <span style={styles.clearBtn} onClick={() => setKeyword('')}>
              ✕
            </span>
          )}
        </div>
        <button
          style={{
            ...styles.filterBtn,
            ...(showFilter ? styles.filterBtnActive : {}),
          }}
          onClick={() => setShowFilter((v) => !v)}
        >
          <span style={{ fontSize: 18 }}>⚙</span>
        </button>
      </div>

      {/* Active Filter Tags */}
      <ActiveTags
        filters={mergedFilters}
        onRemoveKeyword={() => setKeyword('')}
        onRemoveCategory={() => setFilters((f) => ({ ...f, category: undefined }))}
        onRemoveTaste={(t) =>
          setFilters((f) => ({
            ...f,
            tastes: (f.tastes || []).filter((v) => v !== t).length > 0
              ? (f.tastes || []).filter((v) => v !== t)
              : undefined,
          }))
        }
        onRemoveCuisine={() => setFilters((f) => ({ ...f, cuisine: undefined }))}
        onRemoveDifficulty={() => setFilters((f) => ({ ...f, difficulty: undefined }))}
        onRemoveMaxTime={() => setFilters((f) => ({ ...f, maxTime: undefined }))}
        onRemoveMaxCalories={() => setFilters((f) => ({ ...f, maxCalories: undefined }))}
        onClearAll={clearFilters}
      />

      {/* Filter Panel */}
      {showFilter && (
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* Content */}
      <div style={styles.content}>
        {/* Hot Search Tag Cloud */}
        {showHotSearch && (
          <div style={styles.hotSearchSection}>
            <div style={styles.hotSearchTitle}>🔥 热门搜索</div>
            <div style={styles.hotSearchCloud}>
              {HOT_SEARCH_KEYWORDS.map((kw) => (
                <span
                  key={kw}
                  style={styles.hotSearchTag}
                  onClick={() => handleSearch(kw)}
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Result Count */}
        {hasActiveFilters && (
          <div style={styles.resultCount}>
            找到 <strong>{results.length}</strong> 道菜
          </div>
        )}

        {/* Recipe Grid */}
        {results.length > 0 ? (
          <div style={styles.grid}>
            {results.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : hasActiveFilters ? (
          /* Empty State */
          <div style={styles.emptyState}>
            <div style={styles.emptyEmoji}>🍽️</div>
            <div style={styles.emptyTitle}>没有找到相关菜谱</div>
            <div style={styles.emptySubtitle}>试试其他关键词吧</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// =============================================================================
// Styles
// =============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 16px 24px',
    maxWidth: 640,
    margin: '0 auto',
    minHeight: '100vh',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a1a',
    margin: 0,
  },

  // -- Search Bar --
  searchBarRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInputWrap: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: '0 14px',
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  clearBtn: {
    fontSize: 16,
    color: '#999',
    cursor: 'pointer',
    padding: '0 4px',
    userSelect: 'none',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  filterBtnActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    color: '#fff',
  },

  // -- Active Tags --
  activeTagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  activeTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    borderRadius: 16,
    backgroundColor: '#fff3e0',
    color: '#e65100',
    fontSize: 13,
    fontWeight: 500,
  },
  tagClose: {
    cursor: 'pointer',
    fontSize: 12,
    marginLeft: 2,
    opacity: 0.7,
    userSelect: 'none',
  },

  // -- Filter Panel --
  filterOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  filterPanel: {
    backgroundColor: '#fff',
    borderRadius: '20px 20px 0 0',
    width: '100%',
    maxWidth: 640,
    maxHeight: '80vh',
    overflowY: 'auto',
    padding: '20px 16px 32px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  filterResetBtn: {
    fontSize: 14,
    color: '#ff6b35',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    padding: '4px 8px',
  },
  filterSection: {
    marginBottom: 18,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: '#555',
    marginBottom: 8,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    padding: '6px 14px',
    borderRadius: 18,
    border: '1px solid #e0e0e0',
    backgroundColor: '#fff',
    fontSize: 13,
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  filterChipActive: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
    color: '#fff',
  },
  doneBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#ff6b35',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 8,
  },

  // -- Content --
  content: {
    paddingTop: 4,
  },

  // -- Hot Search --
  hotSearchSection: {
    marginBottom: 20,
  },
  hotSearchTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#333',
    marginBottom: 12,
  },
  hotSearchCloud: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  hotSearchTag: {
    padding: '8px 16px',
    borderRadius: 20,
    backgroundColor: '#fef3e2',
    color: '#e65100',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.15s ease',
  },

  // -- Result Count --
  resultCount: {
    fontSize: 14,
    color: '#888',
    marginBottom: 14,
  },

  // -- Recipe Grid --
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 14,
  },

  // -- Recipe Card --
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  cardImage: {
    width: '100%',
    height: 130,
    backgroundColor: '#f8f8f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardEmoji: {
    fontSize: 48,
  },
  cardBody: {
    padding: '10px 12px 12px',
  },
  cardName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a1a',
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardMeta: {
    display: 'flex',
    gap: 6,
    marginBottom: 6,
    fontSize: 12,
    color: '#999',
  },
  cardCategory: {
    padding: '1px 6px',
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    fontSize: 11,
    color: '#666',
  },
  cardDifficulty: {
    fontSize: 11,
    color: '#999',
    lineHeight: '18px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: 12,
    color: '#999',
  },
  cardRating: {
    fontSize: 12,
    color: '#f5a623',
    letterSpacing: 1,
  },

  // -- Empty State --
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#999',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#bbb',
  },
};

export default Search;
