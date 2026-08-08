import React, { Suspense, lazy, useState, useCallback, createContext, useContext, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Error Boundary - 捕获渲染错误，避免白屏
// ---------------------------------------------------------------------------
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          padding: 20, color: '#c00', fontFamily: 'sans-serif',
          maxWidth: '100%', wordBreak: 'break-all', fontSize: 14,
        }
      },
        React.createElement('h2', { style: { fontSize: 18 } }, '⚠️ 页面出错了'),
        React.createElement('pre', {
          style: { whiteSpace: 'pre-wrap', fontSize: 12, background: '#fff0f0', padding: 12, borderRadius: 8 }
        }, this.state.error?.message || '未知错误'),
        React.createElement('pre', {
          style: { whiteSpace: 'pre-wrap', fontSize: 11, color: '#666', marginTop: 8 }
        }, this.state.error?.stack || ''),
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Lazy-loaded page components
// ---------------------------------------------------------------------------
const Home = lazy(() => import('./pages/Home'));
const Categories = lazy(() => import('./pages/Categories'));
const Search = lazy(() => import('./pages/Search'));
const Fridge = lazy(() => import('./pages/Fridge'));
const Profile = lazy(() => import('./pages/Profile'));
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'));
const Challenges = lazy(() => import('./pages/Challenges'));

// ---------------------------------------------------------------------------
// Toast types
// ---------------------------------------------------------------------------
interface Toast {
  id: number;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

// ---------------------------------------------------------------------------
// ToastContext
// ---------------------------------------------------------------------------
const ToastContext = createContext<ToastContextValue | null>(null);

let nextToastId = 0;

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string) => {
      const id = nextToastId++;
      setToasts((prev) => [...prev, { id, message }]);
      const timer = setTimeout(() => {
        removeToast(id);
      }, 2000);
      timersRef.current.set(id, timer);
    },
    [removeToast],
  );

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      {toasts.map((toast) => (
        <ToastNode key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </ToastContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Toast component
// ---------------------------------------------------------------------------
const fadeInKeyframes = `
@keyframes toast-fade-in {
  from { opacity: 0; transform: translate(-50%, -8px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}
`;

const fadeOutKeyframes = `
@keyframes toast-fade-out {
  from { opacity: 1; }
  to   { opacity: 0; }
}
`;

// Inject keyframes once
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.textContent = fadeInKeyframes + fadeOutKeyframes;
  document.head.appendChild(styleEl);
}

interface ToastNodeProps {
  toast: Toast;
  onRemove: (id: number) => void;
}

const ToastNode: React.FC<ToastNodeProps> = ({ toast, onRemove }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Start fade-out at 1800ms, then remove at 2000ms
    const fadeOutTimer = setTimeout(() => {
      setExiting(true);
    }, 1800);

    const removeTimer = setTimeout(() => {
      onRemove(toast.id);
    }, 2000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, onRemove]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '9999px',
    fontSize: 14,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    animation: `${exiting ? 'toast-fade-out 0.2s ease forwards' : 'toast-fade-in 0.25s ease'}`,
  };

  return React.createElement('div', { style }, toast.message);
};

// ---------------------------------------------------------------------------
// useToast hook (exported)
// ---------------------------------------------------------------------------
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};

// ---------------------------------------------------------------------------
// Simple LoadingFallback for Suspense
// ---------------------------------------------------------------------------
const LoadingFallback: React.FC = () => {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: 16,
    color: '#999',
  };

  const spinnerStyle: React.CSSProperties = {
    width: 24,
    height: 24,
    border: '3px solid #e0e0e0',
    borderTopColor: '#333',
    borderRadius: '50%',
    animation: 'toast-spin 0.6s linear infinite',
    marginRight: 10,
  };

  const spinKeyframes = `
@keyframes toast-spin {
  to { transform: rotate(360deg); }
}
`;

  // Inject spin keyframe if not already present
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleEl = document.createElement('style');
      styleEl.textContent = spinKeyframes;
      document.head.appendChild(styleEl);
    }
  }, []);

  return React.createElement(
    'div',
    { style },
    React.createElement('div', { style: spinnerStyle }),
    '加载中...',
  );
};

// ---------------------------------------------------------------------------
// TabBar stub (imported lazily for consistency, or define inline)
// ---------------------------------------------------------------------------
const TabBar = lazy(() => import('./components/TabBar'));

// ---------------------------------------------------------------------------
// Paths that show the TabBar
// ---------------------------------------------------------------------------
const TAB_BAR_PATHS = new Set(['/', '/categories', '/search', '/fridge', '/profile']);

// ---------------------------------------------------------------------------
// App component
// ---------------------------------------------------------------------------
const App: React.FC = () => {
  const location = useLocation();
  const showTabBar = TAB_BAR_PATHS.has(location.pathname);

  return (
    <ToastProvider>
      <ErrorBoundary>
        <div style={{ paddingBottom: showTabBar ? 60 : 0, minHeight: '100vh' }}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/search" element={<Search />} />
              <Route path="/fridge" element={<Fridge />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/challenges" element={<Challenges />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
      {showTabBar && (
        <Suspense fallback={null}>
          <TabBar />
        </Suspense>
      )}
    </ToastProvider>
  );
};

export default App;
