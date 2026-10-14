import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { isWeb, getWindow, getDocument, getLocalStorage } from '../utils';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to resolve theme mode to actual light/dark
function resolveThemeMode(mode: ThemeMode, windowObj: Window | null): 'light' | 'dark' {
  if (mode === 'system') {
    return windowObj?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode;
}

// Apply theme class to document element
function applyThemeClass(documentObj: Document | null, resolvedMode: 'light' | 'dark') {
  if (!documentObj) return;
  documentObj.documentElement.classList.remove('light', 'dark');
  documentObj.documentElement.classList.add(resolvedMode);
}

export function ThemeProvider({ 
  children, 
  defaultMode = 'system',
  onModeChange // Optional callback for syncing with profile/database
}: { 
  children: ReactNode; 
  defaultMode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
}) {
  // Read initial mode from localStorage synchronously to prevent flash
  const getInitialMode = (): ThemeMode => {
    if (!isWeb) return defaultMode;
    const storage = getLocalStorage();
    if (storage) {
      const stored = storage.getItem('theme-mode') as ThemeMode | null;
      if (stored) return stored;
    }
    return defaultMode;
  };

  const [mode, setModeState] = useState<ThemeMode>(getInitialMode);
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Apply theme class immediately on mount and when mode changes
  useEffect(() => {
    if (!isWeb) return;
    
    const windowObj = getWindow();
    const documentObj = getDocument();
    if (!windowObj || !documentObj) return;

    const resolved = resolveThemeMode(mode, windowObj);
    setResolvedMode(resolved);
    applyThemeClass(documentObj, resolved);
    
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem('theme-mode', mode);
    }
    
    // Notify parent (e.g., Settings page) to sync with profile
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [mode, onModeChange]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || !isWeb || mode !== 'system') return;

    const windowObj = getWindow();
    const documentObj = getDocument();
    if (!windowObj || !documentObj) return;

    const mediaQuery = windowObj.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedMode(resolved);
      applyThemeClass(documentObj, resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode, mounted]);

  // Mark as mounted after first render
  useEffect(() => {
    setMounted(true);
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  // Render children immediately but without theme context until mounted
  // This prevents flash by letting the CSS handle initial theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values when not in a provider (e.g., during SSG)
    return {
      mode: 'system' as ThemeMode,
      resolvedMode: 'light' as 'light' | 'dark',
      setMode: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}