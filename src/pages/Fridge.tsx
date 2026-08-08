import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { matchRecipesByFridge, matchLeftoverTransform, type MatchResult } from '../utils/recipeMatcher';
import { COMMON_INGREDIENTS } from '../data/constants';

export default function Fridge() {
  const [inputValue, setInputValue] = useState('');
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'match' | 'leftover'>('match');
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();
  const recipes = useRecipes();

  // ---- Matching logic ----
  const smartMatches = useMemo(() => {
    if (fridgeItems.length === 0 || !hasSearched) return null;
    return matchRecipesByFridge(fridgeItems, recipes);
  }, [fridgeItems, recipes, hasSearched]);

  const leftoverMatches = useMemo(() => {
    if (fridgeItems.length === 0 || !hasSearched) return null;
    return matchLeftoverTransform(fridgeItems, recipes);
  }, [fridgeItems, recipes, hasSearched]);

  const currentResults = activeTab === 'match' ? smartMatches : leftoverMatches;

  // ---- Ingredient management ----
  const addIngredient = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (fridgeItems.some((item) => item === trimmed)) return;
    setFridgeItems((prev) => [...prev, trimmed]);
    setInputValue('');
  };

  const removeIngredient = (name: string) => {
    setFridgeItems((prev) => prev.filter((item) => item !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addIngredient(inputValue);
    }
  };

  // ---- Actions ----
  const handleMatch = () => {
    if (fridgeItems.length === 0) return;
    setHasSearched(true);
    setActiveTab('match');
  };

  const handleLeftover = () => {
    if (fridgeItems.length === 0) return;
    setHasSearched(true);
    setActiveTab('leftover');
  };

  // ---- Helpers ----
  const getMatchLevel = (rate: number): 'high' | 'medium' | 'low' => {
    if (rate > 0.7) return 'high';
    if (rate >= 0.4) return 'medium';
    return 'low';
  };

  const getMatchLabel = (rate: number): string => {
    if (rate > 0.7) return '高匹配';
    if (rate >= 0.4) return '中匹配';
    return '低匹配';
  };

  // ---- Sub-render: ingredient tags ----
  const renderTags = () => {
    if (fridgeItems.length === 0) return null;
    return (
      <div className="fridge-page__tags">
        {fridgeItems.map((item) => (
          <span key={item} className="fridge-page__tag">
            {item}
            <button
              onClick={() => removeIngredient(item)}
              aria-label={`移除 ${item}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );
  };

  // ---- Sub-render: result card ----
  const renderResultCard = (result: MatchResult) => {
    const { recipe, matchRate, matchedIngredients, missingIngredients } = result;
    const matchPercent = Math.round(matchRate * 100);
    const level = getMatchLevel(matchRate);

    return (
      <div
        key={recipe.id}
        className="fridge-result-card"
        onClick={() => navigate(`/recipe/${recipe.id}`)}
      >
        {/* Thumbnail */}
        <div className="fridge-result-card__thumb">
          <img src={recipe.coverImage} alt={recipe.name} />
        </div>

        {/* Info */}
        <div className="fridge-result-card__info">
          <div className="fridge-result-card__title">{recipe.name}</div>
          <div className="fridge-result-card__meta">
            {recipe.taste.map((t) => (
              <span key={t} className="tag" style={{ marginRight: 4 }}>
                {t}
              </span>
            ))}
            <span>{recipe.totalTime}分钟</span>
          </div>

          {/* Ingredients list */}
          <div style={{ marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-hint)', marginRight: 4 }}>
              所需食材：
            </span>
            {matchedIngredients.map((ing) => (
              <span
                key={ing}
                style={{
                  fontSize: 11,
                  color: 'var(--color-success)',
                  marginRight: 4,
                }}
              >
                {ing}
              </span>
            ))}
            {missingIngredients.map((ing) => (
              <span
                key={ing}
                style={{
                  fontSize: 11,
                  color: 'var(--text-hint)',
                  marginRight: 4,
                }}
              >
                {ing}
              </span>
            ))}
          </div>
        </div>

        {/* Match badge */}
        <div className={`fridge-result-card__match fridge-result-card__match--${level}`}>
          <div>{matchPercent}%</div>
          <div style={{ fontSize: 10, fontWeight: 500 }}>{getMatchLabel(matchRate)}</div>
        </div>
      </div>
    );
  };

  // ---- Sub-render: empty state ----
  const renderEmptyState = () => (
    <div className="empty-state">
      <div className="empty-state__emoji">🥕</div>
      <div className="empty-state__title">
        {fridgeItems.length === 0 ? '添加食材开始匹配' : '暂无匹配结果'}
      </div>
      <div className="empty-state__text">
        {fridgeItems.length === 0
          ? '在左侧输入你冰箱里的食材，我们会为你推荐可以做的菜'
          : '当前食材没有找到合适的菜谱，试试添加更多食材或使用"剩菜改造"'}
      </div>
    </div>
  );

  // ---- Sub-render: right panel tabs ----
  const renderTabs = () => {
    const tabStyle: React.CSSProperties = {
      flex: 1,
      minHeight: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 4,
      cursor: 'pointer',
      transition: 'all 150ms var(--ease-out)',
      userSelect: 'none',
    };

    const activeStyle: React.CSSProperties = {
      ...tabStyle,
      background: 'var(--color-primary)',
      color: '#fff',
      boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
    };

    const inactiveStyle: React.CSSProperties = {
      ...tabStyle,
      color: 'var(--text-hint)',
    };

    return (
      <div
        style={{
          display: 'flex',
          background: 'var(--bg-card)',
          borderRadius: 8,
          padding: 3,
          boxShadow: 'var(--shadow-xs)',
          marginBottom: 16,
        }}
      >
        <div
          style={activeTab === 'match' ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab('match')}
        >
          智能匹配
        </div>
        <div
          style={activeTab === 'leftover' ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab('leftover')}
        >
          剩菜改造
        </div>
      </div>
    );
  };

  // ---- Sub-render: common ingredients grid ----
  const renderCommonIngredients = () => (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}
      >
        常见食材
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
          gap: 8,
        }}
      >
        {COMMON_INGREDIENTS.filter((ing) => !fridgeItems.includes(ing)).map((ing) => (
          <button
            key={ing}
            onClick={() => addIngredient(ing)}
            style={{
              minHeight: 32,
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 500,
              borderRadius: 8,
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 150ms var(--ease-out)',
              border: '1.5px solid transparent',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = 'var(--color-primary-bg)';
              (e.target as HTMLElement).style.color = 'var(--color-primary)';
              (e.target as HTMLElement).style.borderColor = 'var(--color-primary-border)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = 'var(--bg-surface)';
              (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              (e.target as HTMLElement).style.borderColor = 'transparent';
            }}
          >
            {ing}
          </button>
        ))}
      </div>
    </div>
  );

  // ---- Main render ----
  return (
    <div className="fridge-page" style={{ paddingTop: 16 }}>
      {/* ==================== LEFT PANEL ==================== */}
      <div className="fridge-page__input-area">
        <h2>🧊 冰箱匹配</h2>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-hint)',
            marginTop: -8,
            marginBottom: 12,
            lineHeight: 1.5,
          }}
        >
          输入你冰箱里的食材，智能匹配你能做的菜谱
        </p>

        {/* Input row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="search-input__field"
            placeholder="输入食材名称，如：鸡蛋"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, height: 44 }}
          />
          <button
            className="btn btn--primary"
            style={{ minHeight: 44, padding: '0 20px', fontSize: 13 }}
            onClick={() => addIngredient(inputValue)}
          >
            添加
          </button>
        </div>

        {/* Added ingredient tags */}
        {renderTags()}

        {/* Common ingredients grid */}
        {renderCommonIngredients()}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            className="btn btn--primary"
            style={{ flex: 1 }}
            onClick={handleMatch}
            disabled={fridgeItems.length === 0}
          >
            🔍 开始匹配
          </button>
          <button
            className="btn btn--outline"
            style={{ flex: 1 }}
            onClick={handleLeftover}
            disabled={fridgeItems.length === 0}
          >
            🔄 剩菜改造
          </button>
        </div>
      </div>

      {/* ==================== RIGHT PANEL ==================== */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-sm)',
          padding: 16,
          marginTop: 16,
        }}
      >
        {renderTabs()}

        {/* Leftover notice */}
        {activeTab === 'leftover' && currentResults && currentResults.length > 0 && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: 14,
              borderRadius: 8,
              background: 'var(--color-success-bg)',
              fontSize: 13,
              color: 'var(--color-success)',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            💡 创意改造方案：用现有食材尝试这些菜吧！
          </div>
        )}

        {/* Results or empty state */}
        {!currentResults ? (
          renderEmptyState()
        ) : currentResults.length === 0 ? (
          renderEmptyState()
        ) : (
          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-hint)',
                marginBottom: 10,
              }}
            >
              共 {currentResults.length} 个结果
            </div>
            {currentResults.map(renderResultCard)}
          </div>
        )}

        {/* CSS patch: make right panel match the left at 1024px+ */}
        <style>{`
          @media (min-width: 1024px) {
            .fridge-page > div:last-child {
              margin-top: 0 !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
