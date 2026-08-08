import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { challenges } from '../data/challenges';
import {
  getChallengeProgress,
  saveChallengeProgress,
  getPoints,
  addPoints,
  addBadge,
  getBadges,
  getStreak,
} from '../utils/storage';
import type { UserChallengeProgress } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeTagColor = (type: string): React.CSSProperties => {
  switch (type) {
    case '每日':
      return { backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' };
    case '主题':
      return { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' };
    case '技能':
      return { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' };
    default:
      return { backgroundColor: '#eee', color: '#666' };
  }
};

const difficultyTagColor = (d: string): React.CSSProperties => {
  switch (d) {
    case '简单':
      return { backgroundColor: 'rgba(46,204,113,0.12)', color: '#27ae60' };
    case '中等':
      return { backgroundColor: 'rgba(243,156,18,0.12)', color: '#e67e22' };
    case '困难':
      return { backgroundColor: 'rgba(231,76,60,0.12)', color: '#c0392b' };
    default:
      return { backgroundColor: '#eee', color: '#666' };
  }
};

// CSS keyframes for confetti
const confettiKeyframes = `
@keyframes ch-confetti-fall {
  0%   { transform: translateY(-100%) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@keyframes ch-modal-in {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
`;

// Inject once
if (typeof document !== 'undefined') {
  const el = document.createElement('style');
  el.textContent = confettiKeyframes;
  document.head.appendChild(el);
}

// Confetti pieces
const CONFETTI_COLORS = ['#FF6B35', '#F39C12', '#2ECC71', '#3498DB', '#E879A6', '#1ABC9C', '#9B59B6'];

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  size: number;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  container: {
    maxWidth: 'var(--max-width, 1200px)',
    margin: '0 auto',
    padding: '16px 16px 32px',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-body)',
  } as React.CSSProperties,

  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(0,0,0,0.06)',
  } as React.CSSProperties,

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'var(--bg-card)',
    fontSize: 20,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-xs)',
    color: 'var(--text-primary)',
    transition: 'background-color var(--transition-fast)',
  } as React.CSSProperties,

  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
  } as React.CSSProperties,

  // Stats row
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 24,
  } as React.CSSProperties,

  statCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 12px',
    textAlign: 'center' as const,
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,

  statEmoji: {
    fontSize: 26,
  } as React.CSSProperties,

  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--color-primary)',
  } as React.CSSProperties,

  statLabel: {
    fontSize: 13,
    color: 'var(--text-hint)',
  } as React.CSSProperties,

  // Badge section
  badgeSection: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    padding: 16,
    marginBottom: 24,
  } as React.CSSProperties,

  badgeSectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  } as React.CSSProperties,

  badgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 10,
  } as React.CSSProperties,

  badgeItem: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 8px',
    textAlign: 'center' as const,
    fontSize: 13,
    fontWeight: 600,
    color: '#5D3A00',
    boxShadow: '0 2px 8px rgba(255,165,0,0.3)',
    wordBreak: 'break-word' as const,
  } as React.CSSProperties,

  badgePlaceholder: {
    fontSize: 14,
    color: 'var(--text-hint)',
    textAlign: 'center' as const,
    padding: 20,
  } as React.CSSProperties,

  // Challenge cards
  challengeCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    padding: 18,
    marginBottom: 14,
    cursor: 'pointer',
    transition: 'box-shadow var(--transition-fast), transform var(--transition-fast)',
    position: 'relative' as const,
    overflow: 'hidden',
  } as React.CSSProperties,

  challengeCardExpanded: {
    boxShadow: 'var(--shadow-md)',
  } as React.CSSProperties,

  challengeCardTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  } as React.CSSProperties,

  challengeIcon: {
    fontSize: 40,
    lineHeight: 1,
    flexShrink: 0,
  } as React.CSSProperties,

  challengeInfo: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  challengeTitle: {
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 6,
  } as React.CSSProperties,

  tagRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    marginBottom: 8,
  } as React.CSSProperties,

  tag: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 'var(--radius-full)',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  challengeDesc: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: 12,
  } as React.CSSProperties,

  rewardPreview: {
    fontSize: 13,
    color: 'var(--color-primary)',
    fontWeight: 600,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  } as React.CSSProperties,

  // Progress bar
  progressBarOuter: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 'var(--radius-full)',
    marginBottom: 8,
    overflow: 'hidden' as const,
  } as React.CSSProperties,

  progressBarFill: (pct: number): React.CSSProperties => ({
    height: '100%',
    width: `${pct}%`,
    backgroundColor: 'var(--color-primary)',
    borderRadius: 'var(--radius-full)',
    transition: 'width var(--transition-base)',
  }),

  progressText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    marginBottom: 12,
  } as React.CSSProperties,

  challengeBtn: {
    padding: '10px 24px',
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: 'var(--color-primary)',
    border: 'none',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  } as React.CSSProperties,

  completedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'var(--color-success)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
  } as React.CSSProperties,

  // Task list (expanded)
  taskList: {
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid rgba(0,0,0,0.06)',
  } as React.CSSProperties,

  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 0',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
  } as React.CSSProperties,

  taskInfo: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  taskTitle: {
    fontSize: 15,
    fontWeight: 500,
    marginBottom: 2,
  } as React.CSSProperties,

  taskDesc: {
    fontSize: 13,
    color: 'var(--text-hint)',
  } as React.CSSProperties,

  taskDoneBtn: {
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: 'var(--color-primary)',
    border: 'none',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background-color var(--transition-fast)',
  } as React.CSSProperties,

  taskDoneCheck: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: 'var(--color-success)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  } as React.CSSProperties,

  taskLink: {
    fontSize: 13,
    color: 'var(--color-primary)',
    fontWeight: 500,
    cursor: 'pointer',
    marginLeft: 8,
    textDecoration: 'underline',
  } as React.CSSProperties,

  // Sidebar (desktop)
  layoutWrapper: {
    display: 'flex',
    gap: 24,
    alignItems: 'flex-start',
  } as React.CSSProperties,

  mainContent: {
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,

  sidebar: {
    width: 280,
    flexShrink: 0,
    position: 'sticky' as const,
    top: 20,
  } as React.CSSProperties,

  sidebarCard: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-sm)',
    padding: 18,
  } as React.CSSProperties,

  sidebarTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 14,
    color: 'var(--text-primary)',
  } as React.CSSProperties,

  sidebarItem: {
    marginBottom: 14,
  } as React.CSSProperties,

  sidebarItemTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 4,
    color: 'var(--text-primary)',
  } as React.CSSProperties,

  sidebarItemDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  } as React.CSSProperties,

  // Celebration modal
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  } as React.CSSProperties,

  modalContent: {
    position: 'relative' as const,
    backgroundColor: '#fff',
    borderRadius: 'var(--radius-xl)',
    padding: '36px 28px 28px',
    maxWidth: 380,
    width: '90%',
    textAlign: 'center' as const,
    boxShadow: 'var(--shadow-xl)',
    animation: 'ch-modal-in 0.4s var(--ease-out-expo) forwards',
    zIndex: 101,
  } as React.CSSProperties,

  modalEmoji: {
    fontSize: 52,
    marginBottom: 12,
  } as React.CSSProperties,

  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    color: 'var(--text-primary)',
  } as React.CSSProperties,

  modalChallengeName: {
    fontSize: 16,
    color: 'var(--text-secondary)',
    marginBottom: 18,
  } as React.CSSProperties,

  modalRewards: {
    display: 'flex',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
  } as React.CSSProperties,

  modalRewardItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 4,
  } as React.CSSProperties,

  modalRewardValue: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--color-primary)',
  } as React.CSSProperties,

  modalRewardLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  } as React.CSSProperties,

  modalCloseBtn: {
    padding: '12px 40px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    backgroundColor: 'var(--color-primary)',
    border: 'none',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer',
    transition: 'background-color var(--transition-fast)',
  } as React.CSSProperties,

  confettiPiece: (piece: ConfettiPiece): React.CSSProperties => ({
    position: 'fixed' as const,
    top: -10,
    left: `${piece.left}%`,
    width: piece.size,
    height: piece.size,
    backgroundColor: piece.color,
    borderRadius: piece.size > 8 ? 2 : 1,
    zIndex: 102,
    animation: `ch-confetti-fall ${1.5 + piece.delay * 0.4}s ease-in ${piece.delay}s both`,
    pointerEvents: 'none' as const,
  }),

  emptyState: {
    textAlign: 'center' as const,
    fontSize: 14,
    color: 'var(--text-hint)',
    padding: 40,
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Confetti
// ---------------------------------------------------------------------------

function Confetti() {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < 50; i++) {
    pieces.push({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 1.2,
      size: 6 + Math.random() * 10,
    });
  }
  return (
    <>
      {pieces.map((p) => (
        <div key={p.id} style={styles.confettiPiece(p)} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// CelebrationModal
// ---------------------------------------------------------------------------

interface CelebrationModalProps {
  challengeTitle: string;
  points: number;
  badge: string;
  onClose: () => void;
}

function CelebrationModal({ challengeTitle, points, badge, onClose }: CelebrationModalProps) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <Confetti />
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalEmoji}>🎉</div>
        <div style={styles.modalTitle}>恭喜完成挑战！</div>
        <div style={styles.modalChallengeName}>{challengeTitle}</div>
        <div style={styles.modalRewards}>
          <div style={styles.modalRewardItem}>
            <div style={styles.modalRewardValue}>+{points}</div>
            <div style={styles.modalRewardLabel}>积分</div>
          </div>
          <div style={styles.modalRewardItem}>
            <div style={styles.modalRewardValue}>🏅</div>
            <div style={styles.modalRewardLabel}>{badge}</div>
          </div>
        </div>
        <button
          style={styles.modalCloseBtn}
          onClick={onClose}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
        >
          太棒了
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Challenges Page
// ---------------------------------------------------------------------------

export default function Challenges() {
  const navigate = useNavigate();

  const [points, setPoints] = useState(() => getPoints());
  const [badges, setBadges] = useState<string[]>(() => getBadges());
  const [streak, setStreak] = useState(() => getStreak().streak);
  const [progressMap, setProgressMap] = useState<Record<string, UserChallengeProgress>>(() => {
    const all = getChallengeProgress();
    const map: Record<string, UserChallengeProgress> = {};
    for (const p of all) {
      map[p.challengeId] = p;
    }
    return map;
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );
  const [celebration, setCelebration] = useState<{
    challengeTitle: string;
    points: number;
    badge: string;
  } | null>(null);

  // Track window width for sidebar visibility
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isDesktop = windowWidth >= 1024;

  // Refresh stats on re-focus
  useEffect(() => {
    const onFocus = () => {
      setPoints(getPoints());
      setBadges(getBadges());
      setStreak(getStreak().streak);
      const all = getChallengeProgress();
      const map: Record<string, UserChallengeProgress> = {};
      for (const p of all) {
        map[p.challengeId] = p;
      }
      setProgressMap(map);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // ----- Actions -----

  const ensureProgress = (challengeId: string): UserChallengeProgress => {
    if (progressMap[challengeId]) return progressMap[challengeId];
    const newProgress: UserChallengeProgress = {
      challengeId,
      startTime: new Date().toISOString(),
      completedTasks: [],
      completed: false,
    };
    saveChallengeProgress(newProgress);
    setProgressMap((prev) => ({ ...prev, [challengeId]: newProgress }));
    return newProgress;
  };

  const toggleExpand = (challengeId: string) => {
    ensureProgress(challengeId);
    setExpanded((prev) => (prev === challengeId ? null : challengeId));
  };

  const markTaskComplete = (challengeId: string, taskId: string) => {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;

    const progress = { ...ensureProgress(challengeId) };
    if (progress.completedTasks.includes(taskId)) return;
    progress.completedTasks = [...progress.completedTasks, taskId];

    // Check if all tasks complete
    const allDone = challenge.tasks.every((t) => progress.completedTasks.includes(t.id));
    if (allDone) {
      progress.completed = true;
      saveChallengeProgress(progress);
      setProgressMap((prev) => ({ ...prev, [challengeId]: progress }));

      // Award rewards
      addPoints(challenge.reward.points);
      addBadge(challenge.reward.badge);
      setPoints(getPoints());
      setBadges(getBadges());

      // Show celebration
      setCelebration({
        challengeTitle: challenge.title,
        points: challenge.reward.points,
        badge: challenge.reward.badge,
      });
    } else {
      saveChallengeProgress(progress);
      setProgressMap((prev) => ({ ...prev, [challengeId]: progress }));
    }
  };

  // ----- Render helpers -----

  const makeChallengeCard = (challenge: (typeof challenges)[number]) => {
    const progress = progressMap[challenge.id];
    const started = !!progress;
    const completed = progress?.completed ?? false;
    const completedCount = progress?.completedTasks.length ?? 0;
    const totalTasks = challenge.tasks.length;
    const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
    const isExpanded = expanded === challenge.id;

    return (
      <div
        key={challenge.id}
        style={{
          ...styles.challengeCard,
          ...(isExpanded ? styles.challengeCardExpanded : {}),
        }}
      >
        {/* Top row */}
        <div style={styles.challengeCardTop}>
          <span style={styles.challengeIcon}>{challenge.icon}</span>
          <div style={styles.challengeInfo}>
            <div style={styles.challengeTitle}>{challenge.title}</div>
            <div style={styles.tagRow}>
              <span style={{ ...styles.tag, ...typeTagColor(challenge.type) }}>
                {challenge.type}
              </span>
              <span style={{ ...styles.tag, ...difficultyTagColor(challenge.difficulty) }}>
                {challenge.difficulty}
              </span>
            </div>
            <div style={styles.challengeDesc}>{challenge.description}</div>

            {/* Reward preview */}
            <div style={styles.rewardPreview}>
              <span>+{challenge.reward.points} 积分</span>
              <span>🏅 {challenge.reward.badge}</span>
            </div>

            {/* Progress bar */}
            <div style={styles.progressBarOuter}>
              <div style={styles.progressBarFill(progressPct)} />
            </div>

            <div style={styles.progressText}>
              已完成 {completedCount}/{totalTasks} 项任务
            </div>

            {/* Action button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {!started ? (
                <button
                  style={styles.challengeBtn}
                  onClick={() => toggleExpand(challenge.id)}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-primary)')
                  }
                >
                  开始挑战
                </button>
              ) : completed ? (
                <span style={styles.completedBadge}>已完成 ✓</span>
              ) : (
                <button
                  style={styles.challengeBtn}
                  onClick={() => toggleExpand(challenge.id)}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = 'var(--color-primary)')
                  }
                >
                  {isExpanded ? '收起' : '继续挑战'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded task list */}
        {isExpanded && !completed && (
          <div style={styles.taskList}>
            {challenge.tasks.map((task) => {
              const taskDone = progress?.completedTasks.includes(task.id) ?? false;
              return (
                <div key={task.id} style={styles.taskItem}>
                  <div style={styles.taskInfo}>
                    <div style={styles.taskTitle}>{task.title}</div>
                    <div style={styles.taskDesc}>
                      {task.description}
                      {task.recipeId && (
                        <span
                          style={styles.taskLink}
                          onClick={() => navigate(`/recipe/${task.recipeId}`)}
                        >
                          查看菜谱
                        </span>
                      )}
                    </div>
                  </div>
                  {taskDone ? (
                    <div style={styles.taskDoneCheck}>✓</div>
                  ) : (
                    <button
                      style={styles.taskDoneBtn}
                      onClick={() => markTaskComplete(challenge.id, task.id)}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)')
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.backgroundColor = 'var(--color-primary)')
                      }
                    >
                      完成
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ----- Sidebar node -----

  const sidebarNode = (
    <div style={styles.sidebar}>
      <div style={styles.sidebarCard}>
        <div style={styles.sidebarTitle}>挑战说明</div>
        <div style={styles.sidebarItem}>
          <div style={styles.sidebarItemTitle}>📅 每日挑战</div>
          <div style={styles.sidebarItemDesc}>
            每天完成一次烹饪打卡，培养规律的烹饪习惯。持续坚持可获得连续天数奖励。
          </div>
        </div>
        <div style={styles.sidebarItem}>
          <div style={styles.sidebarItemTitle}>📋 主题挑战</div>
          <div style={styles.sidebarItemDesc}>
            围绕特定主题（如川菜、低卡、新手）完成一系列菜肴，系统掌握某种烹饪风格。
          </div>
        </div>
        <div style={styles.sidebarItem}>
          <div style={styles.sidebarItemTitle}>⚡ 技能挑战</div>
          <div style={styles.sidebarItemDesc}>
            围绕特定技能（如快手烹饪、宴客大菜）进行专项训练，提升烹饪效率与硬菜能力。
          </div>
        </div>
      </div>
    </div>
  );

  // ----- Main render -----

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          style={styles.backBtn}
          onClick={() => navigate(-1)}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
        >
          ←
        </button>
        <h1 style={styles.headerTitle}>挑战模式</h1>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statEmoji}>⭐</span>
          <span style={styles.statValue}>{points}</span>
          <span style={styles.statLabel}>总积分</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statEmoji}>🏅</span>
          <span style={styles.statValue}>{badges.length}</span>
          <span style={styles.statLabel}>徽章数</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statEmoji}>🔥</span>
          <span style={styles.statValue}>{streak}</span>
          <span style={styles.statLabel}>连续天数</span>
        </div>
      </div>

      {/* Badge collection */}
      <div style={styles.badgeSection}>
        <div style={styles.badgeSectionTitle}>
          <span>🏅</span> 徽章收藏
        </div>
        {badges.length > 0 ? (
          <div style={styles.badgeGrid}>
            {badges.map((badge) => (
              <div key={badge} style={styles.badgeItem}>
                {badge}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.badgePlaceholder}>还没有获得徽章，完成挑战来收集吧！</div>
        )}
      </div>

      {/* Content area */}
      <div style={isDesktop ? styles.layoutWrapper : undefined}>
        <div style={isDesktop ? styles.mainContent : undefined}>
          {challenges.map((ch) => makeChallengeCard(ch))}
        </div>
        {isDesktop && sidebarNode}
      </div>

      {/* Celebration modal */}
      {celebration && (
        <CelebrationModal
          challengeTitle={celebration.challengeTitle}
          points={celebration.points}
          badge={celebration.badge}
          onClose={() => setCelebration(null)}
        />
      )}
    </div>
  );
}
