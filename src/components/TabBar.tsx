import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', label: '首页', emoji: '🏠' },
  { path: '/categories', label: '分类', emoji: '📂' },
  { path: '/search', label: '搜索', emoji: '🔍' },
  { path: '/fridge', label: '冰箱', emoji: '🧊' },
  { path: '/profile', label: '我的', emoji: '👤' },
];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="tab-bar">
      {TABS.map((tab) => {
        const isActive = tab.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            className={`tab-bar__btn ${isActive ? 'tab-bar__btn--active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="tab-bar__emoji">{tab.emoji}</span>
            <span className="tab-bar__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
