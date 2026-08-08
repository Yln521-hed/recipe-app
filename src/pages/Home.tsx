import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useToast } from '../App';
import type { Recipe } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const recipes = useRecipes();
  const { showToast } = useToast();

  // ---- Derived data (memoized) ----

  const todayRecipe = useMemo(() => {
    const topRated = recipes.filter((r) => r && r.rating >= 4.8);
    if (topRated.length === 0) return recipes.find((r) => r != null) || null;
    return topRated[Math.floor(Math.random() * topRated.length)];
  }, [recipes]);

  const hotRecipes = useMemo(
    () =>
      [...recipes]
        .filter((r) => r != null)
        .sort((a, b) => b.cookCount - a.cookCount)
        .slice(0, 8),
    [recipes],
  );

  const quickRecipes = useMemo(
    () =>
      [...recipes]
        .filter((r) => r && r.totalTime <= 15)
        .sort((a, b) => (b && b.rating || 0) - (a && a.rating || 0))
        .slice(0, 8),
    [recipes],
  );

  const lowCalRecipes = useMemo(
    () => recipes.filter((r) => r && r.isLowCalorie).slice(0, 4),
    [recipes],
  );

  const homeStyleRecipes = useMemo(
    () => recipes.filter((r) => r && r.cuisine === '家常菜').slice(0, 4),
    [recipes],
  );

  // ---- Loading state ----

  if (recipes.length === 0) {
    return (
      <div className="home-page">
        <div className="loading-spinner loading-spinner--lg" style={{ marginTop: '40vh' }} />
      </div>
    );
  }

  // ---- Recipe card renderer ----

  const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
    <div
      className="recipe-card"
      onClick={() => {
        navigate('/recipe/' + recipe.id);
      }}
    >
      <div className="recipe-card__cover">
        <img src={recipe.coverImage} alt={recipe.name} />
        <span className="recipe-card__badge tag tag--primary">{recipe.category}</span>
        <span className="recipe-card__time">🕐 {recipe.totalTime}分钟</span>
      </div>
      <div className="recipe-card__info">
        <div className="recipe-card__title">{recipe.name}</div>
        <div className="recipe-card__meta">
          <span>⭐ {recipe.rating.toFixed(1)}</span>
          <span>🔥 {recipe.cookCount}</span>
          <span>{recipe.difficulty}</span>
        </div>
      </div>
    </div>
  );

  // ---- Render ----

  return (
    <div className="home-page">
      {/* ===== 1. Welcome banner ===== */}
      <div
        className="welcome-banner"
        style={{
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
          color: '#fff',
          paddingTop: 32,
          paddingBottom: 20,
        }}
      >
        <div className="welcome-banner__greeting" style={{ color: 'rgba(255,255,255,0.8)' }}>
          👋 你好
        </div>
        <div className="welcome-banner__title" style={{ color: '#fff' }}>
          好厨达人
        </div>
        <div className="welcome-banner__subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
          今天想吃什么？
        </div>
        <button
          className="btn btn--outline"
          style={{
            marginTop: 16,
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.55)',
          }}
          onClick={() => navigate('/challenges')}
        >
          挑战入口 →
        </button>
      </div>

      {/* ===== 2. Search bar ===== */}
      <div style={{ padding: '12px 16px' }}>
        <div className="search-input" onClick={() => navigate('/search')}>
          <span className="search-input__icon">🔍</span>
          <input
            className="search-input__field"
            type="text"
            placeholder="搜索菜谱、食材..."
            readOnly
          />
        </div>
      </div>

      {/* ===== 3. Quick-entry cards ===== */}
      <div className="quick-entry-row">
        <div
          className="quick-entry-card quick-entry-card--blue"
          onClick={() => navigate('/fridge')}
        >
          <div className="quick-entry-card__emoji">🧊</div>
          <div className="quick-entry-card__label">冰箱匹配</div>
        </div>
        <div
          className="quick-entry-card quick-entry-card--orange"
          onClick={() => navigate('/categories')}
        >
          <div className="quick-entry-card__emoji">📂</div>
          <div className="quick-entry-card__label">分类浏览</div>
        </div>
        <div
          className="quick-entry-card quick-entry-card--pink"
          onClick={() => navigate('/challenges')}
        >
          <div className="quick-entry-card__emoji">🏆</div>
          <div className="quick-entry-card__label">关卡挑战</div>
        </div>
      </div>

      {/* ===== 4. Today's recommended hero card ===== */}
      {todayRecipe && (
        <div
          className="hero-recipe"
          onClick={() => navigate('/recipe/' + todayRecipe.id)}
        >
          <div className="hero-recipe__image">
            <img src={todayRecipe.coverImage} alt={todayRecipe.name} />
          </div>
          <div className="hero-recipe__overlay">
            <div className="hero-recipe__tag">今日推荐</div>
            <div className="hero-recipe__title">{todayRecipe.name}</div>
            <div className="hero-recipe__meta">
              ⭐ {todayRecipe.rating} · {todayRecipe.difficulty} · 🕐 {todayRecipe.totalTime}分钟 · 🔥 {todayRecipe.cookCount}
            </div>
          </div>
        </div>
      )}

      {/* ===== 5. 本周热门 — horizontal scroll ===== */}
      <div className="scroll-list">
        <div className="scroll-list__header">
          <div className="scroll-list__title">🔥 本周热门</div>
          <span className="scroll-list__more" onClick={() => navigate('/search')}>
            更多 →
          </span>
        </div>
        <div className="scroll-list__track">
          {hotRecipes.filter((r) => r != null).map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </div>

      {/* ===== 6. 快手菜 — horizontal scroll ===== */}
      <div className="scroll-list">
        <div className="scroll-list__header">
          <div className="scroll-list__title">⚡ 快手菜</div>
          <span className="scroll-list__more" onClick={() => navigate('/search')}>
            更多 →
          </span>
        </div>
        <div className="scroll-list__track">
          {quickRecipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </div>

      {/* ===== 7. 健康低卡 — 2-col grid ===== */}
      <div className="scroll-list">
        <div className="scroll-list__header">
          <div className="scroll-list__title">🥗 健康低卡</div>
          <span className="scroll-list__more" onClick={() => navigate('/search')}>
            更多 →
          </span>
        </div>
      </div>
      <div className="recipe-grid">
        {lowCalRecipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>

      {/* ===== 8. 家常精选 — 2-col grid ===== */}
      <div className="scroll-list">
        <div className="scroll-list__header">
          <div className="scroll-list__title">🏠 家常精选</div>
          <span className="scroll-list__more" onClick={() => navigate('/search')}>
            更多 →
          </span>
        </div>
      </div>
      <div className="recipe-grid">
        {homeStyleRecipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
    </div>
  );
};

export default Home;
