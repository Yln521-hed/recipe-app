import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../hooks/useRecipes';
import {
  getFavorites,
  getNotes,
  getDietRecords,
  getTimers,
  deleteNote,
  deleteTimer,
  saveTimer,
  getPoints,
  getBadges,
  getStreak,
} from '../utils/storage';
import type { RecipeNote, CookingTimer } from '../types';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    paddingBottom: 20,
  },
  // User info card
  userCard: {
    background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
    borderRadius: 20,
    margin: '16px 16px 12px',
    padding: '24px 20px 20px',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  userCardPattern: {
    position: 'absolute',
    top: -30,
    right: -30,
    fontSize: 120,
    opacity: 0.1,
    pointerEvents: 'none' as const,
  },
  avatarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 36,
    backdropFilter: 'blur(4px)',
  },
  userName: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.3,
  },
  streakBadge: {
    fontSize: 13,
    opacity: 0.9,
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: '14px 8px',
    backdropFilter: 'blur(4px)',
  },
  statItem: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.85,
  },
  // Challenge card
  challengeCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: '0 16px 12px',
    padding: '16px 18px',
    backgroundColor: '#fff',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: 'none',
    width: 'calc(100% - 32px)',
    fontSize: 16,
    color: '#333',
  },
  challengeLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  challengeEmoji: {
    fontSize: 28,
  },
  challengeText: {
    fontWeight: 600,
    fontSize: 16,
  },
  challengeArrow: {
    fontSize: 18,
    color: '#ccc',
  },
  // Badge section
  badgeSection: {
    margin: '0 16px 12px',
  },
  badgeSectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#666',
    marginBottom: 8,
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 10,
  },
  badgeCard: {
    background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    borderRadius: 12,
    padding: '10px 14px',
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 2px 8px rgba(247,151,30,0.3)',
  },
  // Tabs
  tabBar: {
    display: 'flex',
    margin: '0 16px 12px',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tab: {
    flex: 1,
    textAlign: 'center' as const,
    padding: '10px 0',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    color: '#999',
    transition: 'all 0.2s',
  },
  tabActive: {
    backgroundColor: '#ff7e5f',
    color: '#fff',
  },
  // Content
  content: {
    margin: '0 16px',
  },
  // Recipe grid
  recipeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    padding: 0,
  },
  recipeCover: {
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover' as const,
    display: 'block',
  },
  recipeInfo: {
    padding: '10px 12px',
  },
  recipeName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#333',
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  recipeMeta: {
    fontSize: 11,
    color: '#999',
  },
  // Note card
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    position: 'relative' as const,
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  noteRecipeName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
  },
  noteDate: {
    fontSize: 11,
    color: '#bbb',
  },
  noteContent: {
    fontSize: 13,
    color: '#666',
    lineHeight: 1.5,
  },
  deleteBtn: {
    position: 'absolute' as const,
    top: 10,
    right: 12,
    background: 'none',
    border: 'none',
    fontSize: 16,
    cursor: 'pointer',
    color: '#ddd',
    padding: '2px 6px',
  },
  // Diet record card
  dietCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  dietInfo: {
    flex: 1,
  },
  dietName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
    marginBottom: 4,
  },
  dietMeta: {
    fontSize: 12,
    color: '#999',
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  mealBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
  },
  // Timer card
  timerCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: '14px 16px',
    marginBottom: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  timerLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: '#333',
  },
  timerDuration: {
    fontSize: 13,
    color: '#999',
  },
  timerActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  startBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteTimerBtn: {
    padding: '4px 10px',
    border: 'none',
    background: '#f5f5f5',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#ccc',
  },
  // Add timer form
  addTimerBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    border: '2px dashed #e0e0e0',
    backgroundColor: '#fff',
    color: '#999',
    fontSize: 14,
    cursor: 'pointer',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timerForm: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: '16px',
    marginBottom: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  timerInput: {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #e0e0e0',
    fontSize: 14,
    outline: 'none',
    flex: 1,
  },
  timerFormRow: {
    display: 'flex',
    gap: 8,
  },
  timerSaveBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  // Empty state
  empty: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#bbb',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 16,
  },
  emptyBtn: {
    padding: '10px 28px',
    borderRadius: 20,
    border: 'none',
    background: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  // Modal overlay
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modalDialog: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: '30px 28px',
    minWidth: 280,
    textAlign: 'center' as const,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: 600,
    color: '#333',
    marginBottom: 16,
  },
  modalCountdown: {
    fontSize: 48,
    fontWeight: 700,
    fontFamily: "'Courier New', Courier, monospace",
    color: '#ff7e5f',
    marginBottom: 20,
  },
  modalBtnRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  modalPauseBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #ff7e5f, #feb47b)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  modalCloseBtn: {
    padding: '10px 24px',
    borderRadius: 10,
    border: '1px solid #e0e0e0',
    background: '#fff',
    color: '#666',
    fontSize: 14,
    cursor: 'pointer',
  },
};

// ---------------------------------------------------------------------------
// Helper: format seconds to mm:ss
// ---------------------------------------------------------------------------
function formatSeconds(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Helper: format date for display
// ---------------------------------------------------------------------------
function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return dateStr.slice(0, 10);
}

// ---------------------------------------------------------------------------
// TimerModal component
// ---------------------------------------------------------------------------
interface TimerModalProps {
  timer: CookingTimer;
  onClose: () => void;
}

const TimerModal: React.FC<TimerModalProps> = ({ timer, onClose }) => {
  const [remaining, setRemaining] = useState(timer.duration);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => alert('时间到！'), 50);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, remaining]);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalDialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalLabel}>{timer.label}</div>
        <div style={styles.modalCountdown}>{formatSeconds(remaining)}</div>
        <div style={styles.modalBtnRow}>
          <button
            style={styles.modalPauseBtn}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? '继续' : '暂停'}
          </button>
          <button style={styles.modalCloseBtn} onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Profile component
// ---------------------------------------------------------------------------
const Profile: React.FC = () => {
  const navigate = useNavigate();
  const recipes = useRecipes();

  // Data from storage
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notes, setNotes] = useState<RecipeNote[]>([]);
  const [dietRecords, setDietRecords] = useState<ReturnType<typeof getDietRecords>>([]);
  const [timers, setTimers] = useState<CookingTimer[]>([]);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [showTimerForm, setShowTimerForm] = useState(false);
  const [timerLabel, setTimerLabel] = useState('');
  const [timerMinutes, setTimerMinutes] = useState('');
  const [activeTimer, setActiveTimer] = useState<CookingTimer | null>(null);

  // Load data
  const loadData = () => {
    setFavorites(getFavorites());
    setNotes(getNotes());
    setDietRecords(getDietRecords());
    setTimers(getTimers());
    setPoints(getPoints());
    setBadges(getBadges());
    setStreak(getStreak().streak);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Find favorite recipes
  const favoriteRecipes = recipes.filter((r) => favorites.includes(r.id));

  // Handle delete note
  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('确定要删除这条笔记吗？')) {
      deleteNote(noteId);
      loadData();
    }
  };

  // Handle delete timer
  const handleDeleteTimer = (timerId: string) => {
    deleteTimer(timerId);
    loadData();
  };

  // Handle save timer
  const handleSaveTimer = () => {
    const label = timerLabel.trim();
    const minutes = parseInt(timerMinutes, 10);
    if (!label) {
      alert('请输入计时器名称');
      return;
    }
    if (isNaN(minutes) || minutes <= 0) {
      alert('请输入有效的分钟数');
      return;
    }
    saveTimer(label, minutes * 60);
    setTimerLabel('');
    setTimerMinutes('');
    setShowTimerForm(false);
    loadData();
  };

  // Meal type badge colors
  const mealColors: Record<string, { bg: string; color: string }> = {
    '早餐': { bg: '#FFF3E0', color: '#E65100' },
    '午餐': { bg: '#E8F5E9', color: '#2E7D32' },
    '晚餐': { bg: '#EDE7F6', color: '#4527A0' },
    '加餐': { bg: '#FCE4EC', color: '#C62828' },
  };

  // Sorted diet records
  const sortedDietRecords = [...dietRecords].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ---- Render ----
  return (
    <div style={styles.page}>
      {/* User info card */}
      <div style={styles.userCard}>
        <div style={styles.userCardPattern}>🍳</div>
        <div style={styles.avatarWrap}>
          <div style={styles.avatar}>👨‍🍳</div>
          <div>
            <div style={styles.userName}>美食爱好者</div>
            <div style={styles.streakBadge}>
              🔥 连续烹饪 {streak} 天
            </div>
          </div>
        </div>
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{favorites.length}</span>
            <span style={styles.statLabel}>收藏数</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{dietRecords.length}</span>
            <span style={styles.statLabel}>饮食记录数</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{points}</span>
            <span style={styles.statLabel}>积分</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statValue}>{badges.length}</span>
            <span style={styles.statLabel}>徽章数</span>
          </div>
        </div>
      </div>

      {/* Challenge entry card */}
      <button
        style={styles.challengeCard}
        onClick={() => navigate('/challenges')}
      >
        <div style={styles.challengeLeft}>
          <span style={styles.challengeEmoji}>🏆</span>
          <span style={styles.challengeText}>挑战关卡</span>
        </div>
        <span style={styles.challengeArrow}>›</span>
      </button>

      {/* Badge section */}
      {badges.length > 0 && (
        <div style={styles.badgeSection}>
          <div style={styles.badgeSectionTitle}>已获得徽章</div>
          <div style={styles.badgeRow}>
            {badges.map((badge, i) => (
              <div key={i} style={styles.badgeCard}>
                🏅 {badge}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabBar}>
        {['收藏', '笔记', '饮食记录', '计时器'].map((label, i) => (
          <button
            key={label}
            style={{
              ...styles.tab,
              ...(activeTab === i ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={styles.content}>
        {/* Tab 1: Favorites */}
        {activeTab === 0 && (
          <>
            {favoriteRecipes.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyEmoji}>💝</div>
                <div style={styles.emptyText}>还没有收藏菜谱</div>
                <button
                  style={styles.emptyBtn}
                  onClick={() => navigate('/')}
                >
                  去发现美食
                </button>
              </div>
            ) : (
              <div style={styles.recipeGrid}>
                {favoriteRecipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    style={styles.recipeCard}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                  >
                    <img
                      src={recipe.coverImage}
                      alt={recipe.name}
                      style={styles.recipeCover}
                    />
                    <div style={styles.recipeInfo}>
                      <div style={styles.recipeName}>{recipe.name}</div>
                      <div style={styles.recipeMeta}>
                        {recipe.difficulty} · {recipe.totalTime}分钟
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tab 2: Notes */}
        {activeTab === 1 && (
          <>
            {notes.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyEmoji}>📝</div>
                <div style={styles.emptyText}>还没有写笔记</div>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} style={styles.noteCard}>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDeleteNote(note.id)}
                    title="删除笔记"
                  >
                    🗑️
                  </button>
                  <div style={styles.noteHeader}>
                    <span style={styles.noteRecipeName}>
                      {note.recipeName}
                    </span>
                    <span style={styles.noteDate}>
                      {formatDateDisplay(note.updatedAt)}
                    </span>
                  </div>
                  <div style={styles.noteContent}>
                    {note.content.length > 50
                      ? note.content.slice(0, 50) + '...'
                      : note.content}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Tab 3: Diet Records */}
        {activeTab === 2 && (
          <>
            {sortedDietRecords.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyEmoji}>📋</div>
                <div style={styles.emptyText}>还没有饮食记录</div>
              </div>
            ) : (
              sortedDietRecords.map((record) => {
                const mealStyle = mealColors[record.mealType] || {
                  bg: '#f0f0f0',
                  color: '#666',
                };
                return (
                  <div key={record.id} style={styles.dietCard}>
                    <span style={{ fontSize: 28 }}>
                      {record.mealType === '早餐'
                        ? '🌅'
                        : record.mealType === '午餐'
                        ? '☀️'
                        : record.mealType === '晚餐'
                        ? '🌙'
                        : '🍪'}
                    </span>
                    <div style={styles.dietInfo}>
                      <div style={styles.dietName}>{record.recipeName}</div>
                      <div style={styles.dietMeta}>
                        <span
                          style={{
                            ...styles.mealBadge,
                            backgroundColor: mealStyle.bg,
                            color: mealStyle.color,
                          }}
                        >
                          {record.mealType === '早餐'
                            ? '早'
                            : record.mealType === '午餐'
                            ? '中'
                            : record.mealType === '晚餐'
                            ? '晚'
                            : '加'}
                        </span>
                        <span>{record.servings}份</span>
                        <span>{record.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* Tab 4: Timers */}
        {activeTab === 3 && (
          <>
            {/* Add timer button / form */}
            {!showTimerForm ? (
              <button
                style={styles.addTimerBtn}
                onClick={() => setShowTimerForm(true)}
              >
                ⏱️ 添加计时器
              </button>
            ) : (
              <div style={styles.timerForm}>
                <input
                  style={styles.timerInput}
                  type="text"
                  placeholder="计时器名称（如：炖牛肉）"
                  value={timerLabel}
                  onChange={(e) => setTimerLabel(e.target.value)}
                />
                <div style={styles.timerFormRow}>
                  <input
                    style={styles.timerInput}
                    type="number"
                    placeholder="时长（分钟）"
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(e.target.value)}
                    min="1"
                  />
                  <button style={styles.timerSaveBtn} onClick={handleSaveTimer}>
                    保存
                  </button>
                </div>
              </div>
            )}

            {/* Timer list */}
            {timers.length === 0 ? (
              <div style={styles.empty}>
                <div style={styles.emptyEmoji}>⏰</div>
                <div style={styles.emptyText}>还没有计时器</div>
              </div>
            ) : (
              timers.map((t) => (
                <div key={t.id} style={styles.timerCard}>
                  <div style={styles.timerInfo}>
                    <span style={{ fontSize: 24 }}>⏱️</span>
                    <div>
                      <div style={styles.timerLabel}>{t.label}</div>
                      <div style={styles.timerDuration}>
                        {formatSeconds(t.duration)}
                      </div>
                    </div>
                  </div>
                  <div style={styles.timerActions}>
                    <button
                      style={styles.startBtn}
                      onClick={() => setActiveTimer(t)}
                    >
                      开始
                    </button>
                    <button
                      style={styles.deleteTimerBtn}
                      onClick={() => handleDeleteTimer(t.id)}
                      title="删除计时器"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Timer modal */}
      {activeTimer && (
        <TimerModal
          timer={activeTimer}
          onClose={() => setActiveTimer(null)}
        />
      )}
    </div>
  );
};

export default Profile;
