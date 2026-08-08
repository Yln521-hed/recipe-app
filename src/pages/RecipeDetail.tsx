import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import { useToast } from '../App';
import { scaleIngredient, scaleNutrition, formatTime, formatCalories } from '../utils/helpers';
import { toggleFavorite, isFavorite, saveNote, getNoteForRecipe, addDietRecord, getCoverImages, setCoverImage } from '../utils/storage';
import type { Ingredient, Nutrition, MealType } from '../types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    backgroundColor: '#fff',
    minHeight: '100vh',
    paddingBottom: 80,
    position: 'relative',
  },
  backBtn: {
    position: 'fixed',
    top: 12,
    left: 12,
    zIndex: 40,
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: '#fff',
    border: 'none',
    fontSize: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    lineHeight: 1,
    padding: 0,
  },
  coverSection: {
    position: 'relative',
    width: '100%',
    height: 280,
    overflow: 'hidden',
    backgroundColor: '#FFF8F0',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  changeImgBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 13,
    cursor: 'pointer',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
    padding: '40px 20px 20px',
    color: '#fff',
  },
  recipeName: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    textShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-around',
    padding: '16px 12px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #f0f0f0',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    fontSize: 13,
    color: '#666',
  },
  infoEmoji: {
    fontSize: 20,
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '12px 16px',
  },
  tag: {
    padding: '4px 12px',
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: '#FFF0E6',
    color: '#E07B3C',
  },
  badgeLowCalorie: {
    padding: '4px 12px',
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
  },
  badgeQuick: {
    padding: '4px 12px',
    borderRadius: 9999,
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
  },
  servingsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  servingsLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
  },
  servingsBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '2px solid #FF6B35',
    backgroundColor: '#fff',
    color: '#FF6B35',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
    transition: 'all 0.15s',
  },
  servingsBtnDisabled: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: '2px solid #ddd',
    backgroundColor: '#f5f5f5',
    color: '#ccc',
    fontSize: 20,
    cursor: 'not-allowed',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  },
  servingsNum: {
    fontSize: 22,
    fontWeight: 700,
    color: '#FF6B35',
    minWidth: 32,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#333',
    padding: '16px 20px 8px',
    margin: 0,
  },
  ingredientItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 20px',
    fontSize: 15,
    borderBottom: '1px solid #f9f9f9',
  },
  ingredientName: {
    color: '#333',
  },
  ingredientAmount: {
    color: '#888',
  },
  jdBtn: {
    display: 'block',
    margin: '12px 20px',
    padding: '10px 0',
    backgroundColor: '#FF6B35',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    width: 'calc(100% - 40px)',
  },
  nutritionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    padding: '0 20px 16px',
  },
  nutritionCard: {
    borderRadius: 12,
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  nutritionLabel: {
    fontSize: 13,
    opacity: 0.85,
  },
  nutritionValue: {
    fontSize: 22,
    fontWeight: 700,
  },
  nutritionUnit: {
    fontSize: 12,
    fontWeight: 500,
    opacity: 0.7,
  },
  stepCard: {
    margin: '0 20px 16px',
    backgroundColor: '#fff',
    borderRadius: 12,
    border: '1px solid #f0f0f0',
    overflow: 'hidden',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '14px 14px 8px',
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#FF6B35',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
    lineHeight: 1,
  },
  stepInstruction: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 1.6,
    paddingTop: 2,
  },
  stepTip: {
    margin: '4px 14px 10px',
    padding: '10px 14px',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    fontSize: 13,
    color: '#8B6914',
    lineHeight: 1.5,
    borderLeft: '3px solid #FCD34D',
  },
  stepTimerBtn: {
    margin: '4px 14px 10px',
    padding: '8px 14px',
    backgroundColor: '#FFF0E6',
    color: '#E07B3C',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  tipsSection: {
    margin: '0 20px 20px',
    padding: '14px 16px',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    border: '1px solid #FDE68A',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#8B6914',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#8B6914',
    lineHeight: 1.7,
    paddingLeft: 4,
  },
  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    maxWidth: 480,
    margin: '0 auto',
    backgroundColor: '#fff',
    borderTop: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: '8px 4px',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    zIndex: 30,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
  },
  bottomBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '6px 8px',
    fontSize: 12,
    color: '#666',
  },
  bottomBtnIcon: {
    fontSize: 22,
  },
  // Modal shared
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 'calc(100% - 60px)',
    maxWidth: 360,
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 12,
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e0e0e0',
    borderRadius: 10,
    fontSize: 15,
    outline: 'none',
    resize: 'vertical',
    minHeight: 100,
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  modalBtnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalBtnPrimary: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: '#FF6B35',
    color: '#fff',
  },
  modalBtnCancel: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  // Note bottom sheet
  sheetOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  sheetBox: {
    backgroundColor: '#fff',
    borderRadius: '16px 16px 0 0',
    padding: '20px 20px 28px',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
    animation: 'sheetSlideUp 0.25s ease',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    margin: '0 auto 16px',
  },
  // Meal type selector
  mealTypeRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mealTypeBtn: (active: boolean): React.CSSProperties => ({
    padding: '8px 18px',
    borderRadius: 9999,
    border: active ? '2px solid #FF6B35' : '2px solid #e0e0e0',
    backgroundColor: active ? '#FFF0E6' : '#fff',
    color: active ? '#E07B3C' : '#666',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
  }),
  // Timer modal
  timerDisplay: {
    fontSize: 64,
    fontWeight: 700,
    fontFamily: 'monospace',
    color: '#FF6B35',
    textAlign: 'center',
    margin: '16px 0',
  },
  timerLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  timerBtnRow: {
    display: 'flex',
    gap: 10,
  },
  // Not found
  notFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: 16,
    color: '#999',
  },
};

// ---------------------------------------------------------------------------
// Inject keyframes for bottom sheet animation
// ---------------------------------------------------------------------------
const sheetKeyframes = `
@keyframes sheetSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}
`;
if (typeof document !== 'undefined') {
  const existing = document.getElementById('recipe-detail-styles');
  if (!existing) {
    const styleEl = document.createElement('style');
    styleEl.id = 'recipe-detail-styles';
    styleEl.textContent = sheetKeyframes;
    document.head.appendChild(styleEl);
  }
}

// ---------------------------------------------------------------------------
// RecipeDetail component
// ---------------------------------------------------------------------------
const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipes = useRecipes();
  const { showToast } = useToast();

  const recipe = useMemo(() => recipes.find((r) => r.id === id), [recipes, id]);

  // ----- state -----
  const [servings, setServings] = useState<number>(recipe?.servings ?? 2);
  const [favorited, setFavorited] = useState<boolean>(false);
  const [customCover, setCustomCover] = useState<string | null>(null);

  // Image dialog
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  // Note sheet
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // Diet record dialog
  const [showDietDialog, setShowDietDialog] = useState(false);
  const [dietMealType, setDietMealType] = useState<MealType>('午餐');
  const [dietServings, setDietServings] = useState<number>(recipe?.servings ?? 2);
  const [dietNote, setDietNote] = useState('');

  // Timer modal
  const [timerData, setTimerData] = useState<{
    label: string;
    totalSeconds: number;
  } | null>(null);
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ----- effects -----
  useEffect(() => {
    if (id) {
      setFavorited(isFavorite(id));
      const images = getCoverImages();
      setCustomCover(images[id] || null);
    }
  }, [id]);

  useEffect(() => {
    if (recipe) {
      setServings(recipe.servings);
    }
  }, [recipe]);

  // Load existing note
  useEffect(() => {
    if (id) {
      const existing = getNoteForRecipe(id);
      setNoteContent(existing?.content || '');
    }
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (timerData && !timerPaused) {
      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerData, timerPaused]);

  // ----- derived data -----
  const scaledIngredients = useMemo<Ingredient[]>(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) =>
      scaleIngredient(ing, recipe.servings, servings),
    );
  }, [recipe, servings]);

  const scaledSeasonings = useMemo<Ingredient[]>(() => {
    if (!recipe) return [];
    return recipe.seasonings.map((s) =>
      scaleIngredient(s, recipe.servings, servings),
    );
  }, [recipe, servings]);

  const scaledNutrition = useMemo<Nutrition>(() => {
    if (!recipe) return { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
    return scaleNutrition(recipe.nutrition, recipe.servings, servings);
  }, [recipe, servings]);

  // ----- handlers -----
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleServingsMinus = useCallback(() => {
    setServings((s) => Math.max(1, s - 1));
  }, []);

  const handleServingsPlus = useCallback(() => {
    setServings((s) => Math.min(12, s + 1));
  }, []);

  const handleFavoriteToggle = useCallback(() => {
    if (!id) return;
    const result = toggleFavorite(id);
    setFavorited(result);
    showToast(result ? '已收藏' : '已取消收藏');
  }, [id, showToast]);

  const handleJDShop = useCallback(() => {
    if (!recipe) return;
    const names = [
      ...recipe.ingredients.map((i) => i.name),
      ...recipe.seasonings.map((s) => s.name),
    ];
    const query = names.join(' ');
    window.open(
      `https://search.jd.com/Search?keyword=${encodeURIComponent(query)}&enc=utf-8`,
      '_blank',
    );
  }, [recipe]);

  const handleShare = useCallback(async () => {
    if (!recipe) return;
    const text = `${recipe.name} - ${formatTime(recipe.totalTime)} | ${formatCalories(recipe.nutrition.calories)}`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: recipe.name, text });
      } catch {
        // user cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${recipe.name}\n${text}\n${window.location.href}`,
        );
        showToast('已复制到剪贴板');
      } catch {
        showToast('分享失败');
      }
    }
  }, [recipe, showToast]);

  // Image dialog
  const handleOpenImageDialog = useCallback(() => {
    setImageUrlInput('');
    setImagePreview('');
    setShowImageDialog(true);
  }, []);

  const handleImageUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setImageUrlInput(url);
      if (url.trim()) {
        setImagePreview(url.trim());
      } else {
        setImagePreview('');
      }
    },
    [],
  );

  const handleImageConfirm = useCallback(() => {
    if (!id || !imageUrlInput.trim()) return;
    setCoverImage(id, imageUrlInput.trim());
    setCustomCover(imageUrlInput.trim());
    setShowImageDialog(false);
    showToast('封面已更新');
  }, [id, imageUrlInput, showToast]);

  // Note sheet
  const handleOpenNoteSheet = useCallback(() => {
    if (id) {
      const existing = getNoteForRecipe(id);
      setNoteContent(existing?.content || '');
    }
    setShowNoteSheet(true);
  }, [id]);

  const handleSaveNote = useCallback(() => {
    if (!id || !recipe) return;
    if (!noteContent.trim()) {
      showToast('笔记内容不能为空');
      return;
    }
    saveNote(id, recipe.name, noteContent.trim());
    setShowNoteSheet(false);
    showToast('笔记已保存');
  }, [id, recipe, noteContent, showToast]);

  // Diet record dialog
  const handleOpenDietDialog = useCallback(() => {
    setDietMealType('午餐');
    setDietServings(servings);
    setDietNote('');
    setShowDietDialog(true);
  }, [servings]);

  const handleSaveDietRecord = useCallback(() => {
    if (!id || !recipe) return;
    addDietRecord(id, recipe.name, dietServings, dietMealType, dietNote.trim() || undefined);
    setShowDietDialog(false);
    showToast('饮食记录已添加');
  }, [id, recipe, dietServings, dietMealType, dietNote, showToast]);

  // Timer
  const handleStartTimer = useCallback(
    (label: string, minutes: number) => {
      const totalSeconds = minutes * 60;
      setTimerData({ label, totalSeconds });
      setTimerRemaining(totalSeconds);
      setTimerPaused(false);
    },
    [],
  );

  const handlePauseResumeTimer = useCallback(() => {
    setTimerPaused((p) => !p);
  }, []);

  const handleCloseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerData(null);
    setTimerPaused(false);
  }, []);

  // Format timer display MM:SS
  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ----- render: not found -----
  if (!recipe) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={handleBack}>
          ←
        </button>
        <div style={styles.notFound}>
          <div style={{ fontSize: 48 }}>🍽️</div>
          <div>食谱未找到</div>
          <button
            onClick={handleBack}
            style={{
              padding: '8px 24px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#FF6B35',
              color: '#fff',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  const coverUrl = customCover || recipe.coverImage;

  return (
    <div style={styles.container}>
      {/* ======== Back Button ======== */}
      <button style={styles.backBtn} onClick={handleBack} aria-label="返回">
        ←
      </button>

      {/* ======== Cover Image Section ======== */}
      <div style={styles.coverSection}>
        <img
          src={coverUrl}
          alt={recipe.name}
          style={styles.coverImg}
          onError={(e) => {
            // Fallback if custom image fails to load
            (e.target as HTMLImageElement).src = recipe.coverImage;
          }}
        />
        <button style={styles.changeImgBtn} onClick={handleOpenImageDialog}>
          换图
        </button>
        <div style={styles.nameOverlay}>
          <h1 style={styles.recipeName}>{recipe.name}</h1>
        </div>
      </div>

      {/* ======== Info Row ======== */}
      <div style={styles.infoRow}>
        <div style={styles.infoItem}>
          <span style={styles.infoEmoji}>⏱️</span>
          <span>{formatTime(recipe.totalTime)}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoEmoji}>📊</span>
          <span>{recipe.difficulty}</span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoEmoji}>🔥</span>
          <span>
            {formatCalories(
              Math.round(recipe.nutrition.calories / recipe.servings),
            )}
          </span>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoEmoji}>📁</span>
          <span>{recipe.category}</span>
        </div>
      </div>

      {/* ======== Tags Row ======== */}
      <div style={styles.tagsRow}>
        {recipe.taste.map((t) => (
          <span key={t} style={styles.tag}>
            {t}
          </span>
        ))}
        {recipe.isLowCalorie && (
          <span style={styles.badgeLowCalorie}>低卡</span>
        )}
        {recipe.isQuick && (
          <span style={styles.badgeQuick}>快手菜</span>
        )}
        {recipe.tags.map((t) => (
          <span key={t} style={styles.tag}>
            {t}
          </span>
        ))}
      </div>

      {/* ======== Servings Selector ======== */}
      <div style={styles.servingsRow}>
        <span style={styles.servingsLabel}>份量：</span>
        <button
          style={servings <= 1 ? styles.servingsBtnDisabled : styles.servingsBtn}
          onClick={handleServingsMinus}
          disabled={servings <= 1}
        >
          −
        </button>
        <span style={styles.servingsNum}>{servings}</span>
        <button
          style={servings >= 12 ? styles.servingsBtnDisabled : styles.servingsBtn}
          onClick={handleServingsPlus}
          disabled={servings >= 12}
        >
          +
        </button>
      </div>

      {/* ======== Ingredients Section ======== */}
      <h3 style={styles.sectionTitle}>🥘 主要食材</h3>
      {scaledIngredients.map((ing, idx) => (
        <div key={idx} style={styles.ingredientItem}>
          <span style={styles.ingredientName}>{ing.name}</span>
          <span style={styles.ingredientAmount}>{ing.amount}</span>
        </div>
      ))}

      {scaledSeasonings.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>🧂 调料</h3>
          {scaledSeasonings.map((s, idx) => (
            <div key={idx} style={styles.ingredientItem}>
              <span style={styles.ingredientName}>{s.name}</span>
              <span style={styles.ingredientAmount}>{s.amount}</span>
            </div>
          ))}
        </>
      )}

      <button style={styles.jdBtn} onClick={handleJDShop}>
        🛒 一键买菜
      </button>

      {/* ======== Nutrition Section ======== */}
      <h3 style={styles.sectionTitle}>📊 营养成分</h3>
      <div style={styles.nutritionGrid}>
        {/* Calories - red/orange */}
        <div
          style={{
            ...styles.nutritionCard,
            backgroundColor: '#FFF5F0',
          }}
        >
          <span style={styles.nutritionLabel}>热量</span>
          <span style={{ ...styles.nutritionValue, color: '#FF6B35' }}>
            {scaledNutrition.calories}
          </span>
          <span style={styles.nutritionUnit}>千卡</span>
        </div>
        {/* Protein - blue */}
        <div
          style={{
            ...styles.nutritionCard,
            backgroundColor: '#F0F5FF',
          }}
        >
          <span style={styles.nutritionLabel}>蛋白质</span>
          <span style={{ ...styles.nutritionValue, color: '#2563EB' }}>
            {scaledNutrition.protein}
          </span>
          <span style={styles.nutritionUnit}>克</span>
        </div>
        {/* Fat - yellow */}
        <div
          style={{
            ...styles.nutritionCard,
            backgroundColor: '#FFFDF0',
          }}
        >
          <span style={styles.nutritionLabel}>脂肪</span>
          <span style={{ ...styles.nutritionValue, color: '#D97706' }}>
            {scaledNutrition.fat}
          </span>
          <span style={styles.nutritionUnit}>克</span>
        </div>
        {/* Carbs - green */}
        <div
          style={{
            ...styles.nutritionCard,
            backgroundColor: '#F0FFF4',
          }}
        >
          <span style={styles.nutritionLabel}>碳水</span>
          <span style={{ ...styles.nutritionValue, color: '#059669' }}>
            {scaledNutrition.carbs}
          </span>
          <span style={styles.nutritionUnit}>克</span>
        </div>
      </div>

      {/* ======== Steps Section ======== */}
      <h3 style={styles.sectionTitle}>📝 烹饪步骤</h3>
      {recipe.steps.map((step) => (
        <div key={step.order} style={styles.stepCard}>
          <div style={styles.stepHeader}>
            <div style={styles.stepNum}>{step.order}</div>
            <div style={styles.stepInstruction}>{step.instruction}</div>
          </div>
          {step.tip && (
            <div style={styles.stepTip}>💡 {step.tip}</div>
          )}
          {step.time && step.time > 0 && (
            <button
              style={styles.stepTimerBtn}
              onClick={() =>
                handleStartTimer(
                  `步骤 ${step.order}`,
                  step.time!,
                )
              }
            >
              ⏱ 计时 {step.time}分钟
            </button>
          )}
        </div>
      ))}

      {/* ======== Tips Section ======== */}
      <h3 style={styles.sectionTitle}>💡 烹饪小贴士</h3>
      <div style={styles.tipsSection}>
        {recipe.tips.map((tip, idx) => (
          <div key={idx} style={styles.tipItem}>
            {idx + 1}. {tip}
          </div>
        ))}
      </div>

      {/* Spacer for bottom bar */}
      <div style={{ height: 20 }} />

      {/* ======== Bottom Action Bar ======== */}
      <div style={styles.bottomBar}>
        <button
          style={{
            ...styles.bottomBtn,
            color: favorited ? '#E53935' : '#666',
          }}
          onClick={handleFavoriteToggle}
        >
          <span style={styles.bottomBtnIcon}>
            {favorited ? '❤️' : '🤍'}
          </span>
          <span>{favorited ? '已收藏' : '收藏'}</span>
        </button>
        <button style={styles.bottomBtn} onClick={handleOpenNoteSheet}>
          <span style={styles.bottomBtnIcon}>📝</span>
          <span>笔记</span>
        </button>
        <button style={styles.bottomBtn} onClick={handleOpenDietDialog}>
          <span style={styles.bottomBtnIcon}>✅</span>
          <span>记录</span>
        </button>
        <button style={styles.bottomBtn} onClick={handleJDShop}>
          <span style={styles.bottomBtnIcon}>🛒</span>
          <span>买菜</span>
        </button>
        <button style={styles.bottomBtn} onClick={handleShare}>
          <span style={styles.bottomBtnIcon}>📤</span>
          <span>分享</span>
        </button>
      </div>

      {/* ======== MODALS ======== */}

      {/* ----- Image Change Dialog ----- */}
      {showImageDialog && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowImageDialog(false)}
        >
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>更换封面</div>
            <input
              type="text"
              placeholder="输入图片 URL 地址"
              value={imageUrlInput}
              onChange={handleImageUrlChange}
              style={styles.input}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="预览"
                style={styles.imagePreview}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div style={styles.modalBtnRow}>
              <button
                style={styles.modalBtnCancel}
                onClick={() => setShowImageDialog(false)}
              >
                取消
              </button>
              <button
                style={styles.modalBtnPrimary}
                onClick={handleImageConfirm}
                disabled={!imageUrlInput.trim()}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----- Note Bottom Sheet ----- */}
      {showNoteSheet && (
        <div
          style={styles.sheetOverlay}
          onClick={() => setShowNoteSheet(false)}
        >
          <div style={styles.sheetBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHandle} />
            <div style={styles.modalTitle}>📝 我的笔记</div>
            <textarea
              placeholder="记录你的烹饪心得..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              style={{ ...styles.textarea, marginBottom: 16 }}
            />
            <div style={styles.modalBtnRow}>
              <button
                style={styles.modalBtnCancel}
                onClick={() => setShowNoteSheet(false)}
              >
                取消
              </button>
              <button
                style={styles.modalBtnPrimary}
                onClick={handleSaveNote}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----- Diet Record Dialog ----- */}
      {showDietDialog && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowDietDialog(false)}
        >
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>✅ 记录饮食</div>

            {/* Meal type selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                餐次
              </div>
              <div style={styles.mealTypeRow}>
                {(['早餐', '午餐', '晚餐', '加餐'] as MealType[]).map((mt) => (
                  <button
                    key={mt}
                    style={styles.mealTypeBtn(dietMealType === mt)}
                    onClick={() => setDietMealType(mt)}
                  >
                    {mt}
                  </button>
                ))}
              </div>
            </div>

            {/* Servings */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                份量
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  style={
                    dietServings <= 1
                      ? styles.servingsBtnDisabled
                      : styles.servingsBtn
                  }
                  onClick={() => setDietServings((s) => Math.max(1, s - 1))}
                  disabled={dietServings <= 1}
                >
                  −
                </button>
                <span style={styles.servingsNum}>{dietServings}</span>
                <button
                  style={
                    dietServings >= 12
                      ? styles.servingsBtnDisabled
                      : styles.servingsBtn
                  }
                  onClick={() => setDietServings((s) => Math.min(12, s + 1))}
                  disabled={dietServings >= 12}
                >
                  +
                </button>
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                备注（选填）
              </div>
              <input
                type="text"
                placeholder="添加备注..."
                value={dietNote}
                onChange={(e) => setDietNote(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.modalBtnRow}>
              <button
                style={styles.modalBtnCancel}
                onClick={() => setShowDietDialog(false)}
              >
                取消
              </button>
              <button
                style={styles.modalBtnPrimary}
                onClick={handleSaveDietRecord}
              >
                确认记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----- Timer Modal ----- */}
      {timerData && (
        <div
          style={{
            ...styles.modalOverlay,
            cursor: 'default',
          }}
        >
          <div
            style={{
              ...styles.modalBox,
              textAlign: 'center',
            }}
          >
            <div style={styles.modalTitle}>⏱ 计时器</div>
            <div style={styles.timerDisplay}>
              {formatCountdown(timerRemaining)}
            </div>
            <div style={styles.timerLabel}>{timerData.label}</div>
            <div style={styles.timerBtnRow}>
              <button
                style={{
                  ...styles.modalBtn,
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={handleCloseTimer}
              >
                关闭
              </button>
              <button
                style={{
                  ...styles.modalBtn,
                  backgroundColor: '#FF6B35',
                  color: '#fff',
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={handlePauseResumeTimer}
              >
                {timerPaused ? '继续' : '暂停'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;
