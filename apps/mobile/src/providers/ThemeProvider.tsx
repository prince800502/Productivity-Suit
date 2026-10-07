import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, defaultMode = 'system' }: { children: ReactNode; defaultMode?: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from AsyncStorage if needed
    const stored = defaultMode;
    if (stored) {
      setMode(stored);
    }
  }, [defaultMode]);

  useEffect(() => {
    if (!mounted) return;

    let resolved: 'light' | 'dark';
    if (mode === 'system') {
      const colorScheme = Appearance.getColorScheme();
      resolved = colorScheme === 'dark' ? 'dark' : 'light';
    } else {
      resolved = mode;
    }
    setResolvedMode(resolved);
  }, [mode, mounted]);

  useEffect(() => {
    if (!mounted || mode !== 'system') return;

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      const resolved = colorScheme === 'dark' ? 'dark' : 'light';
      setResolvedMode(resolved);
    });

    return () => subscription.remove();
  }, [mode, mounted]);

  const toggleTheme = () => {
    setMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

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
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}