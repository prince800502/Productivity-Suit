// Design Tokens - Single source of truth for the design system
// Premium Dark Glassmorphism Design System

export const colors = {
  // Primary brand colors - Deep Indigo/Violet
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#7567FF',  // Updated: Deep Indigo
    600: '#5c4dff',
    700: '#4a3eff',
    800: '#3d33e0',
    900: '#352db8',
    950: '#211f70',
  },
  
  // Secondary/accent colors - Sky Blue/Cyan
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38BDF8',  // Updated: Bright Sky Blue
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Tertiary accent - Violet/Purple
  tertiary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },

  // Success colors - Emerald
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  // Warning colors - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },

  // Error/danger colors - Rose
  danger: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },

  // Neutral grays - Slate
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Semantic colors (light mode)
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    surfaceGlass: 'rgba(255, 255, 255, 0.85)',
    surfaceGlassStrong: 'rgba(255, 255, 255, 0.95)',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    borderGlass: 'rgba(148, 163, 184, 0.3)',
    
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textTertiary: '#94a3b8',
    textInverse: '#ffffff',
    textLink: '#7567FF',
    
    primary: '#7567FF',
    primaryHover: '#5c4dff',
    primaryLight: '#e0e7ff',
    primaryGlass: 'rgba(117, 103, 255, 0.1)',
    
    secondary: '#38BDF8',
    secondaryHover: '#0ea5e9',
    secondaryLight: '#e0f2fe',
    secondaryGlass: 'rgba(56, 189, 248, 0.1)',
    
    tertiary: '#a855f7',
    tertiaryHover: '#9333ea',
    tertiaryLight: '#f3e8ff',
    tertiaryGlass: 'rgba(168, 85, 247, 0.1)',
    
    success: '#10b981',
    successLight: '#d1fae5',
    successGlass: 'rgba(16, 185, 129, 0.1)',
    
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    warningGlass: 'rgba(245, 158, 11, 0.1)',
    
    danger: '#f43f5e',
    dangerLight: '#ffe4e6',
    dangerGlass: 'rgba(244, 63, 94, 0.1)',
    
    focusRing: '#7567FF',
    overlay: 'rgba(15, 23, 42, 0.5)',
    overlayStrong: 'rgba(15, 23, 42, 0.7)',
  },

  // Semantic colors (dark mode) - Deep Navy with Indigo/Violet accents
  dark: {
    background: '#030712',           // Deeper navy for more contrast
    backgroundSecondary: '#080F1E',  // Secondary layer
    backgroundTertiary: '#0E172B',   // Tertiary layer
    surface: '#0A1222',              // Card surface
    surfaceElevated: '#111A2E',      // Elevated surface
    surfaceGlass: 'rgba(10, 18, 34, 0.6)',    // More transparent glass
    surfaceGlassStrong: 'rgba(10, 18, 34, 0.8)', // Stronger glass
    border: '#141E35',               // Subtle border
    borderStrong: '#1E2D45',         // Stronger border
    borderGlass: 'rgba(120, 113, 255, 0.22)',  // Primary tint border
    
    textPrimary: '#F8FAFC',          // Pure white for primary text
    textSecondary: '#B8C5D6',        // Softer secondary
    textTertiary: '#7A8A9F',         // Muted tertiary
    textInverse: '#030712',
    textLink: '#B8D0FF',             // Lighter link
    
    primary: '#B8D0FF',              // Lighter indigo for dark mode
    primaryHover: '#D0E0FF',
    primaryLight: '#1A1860',
    primaryGlass: 'rgba(117, 103, 255, 0.22)',
    
    secondary: '#38BDF8',            // Bright cyan
    secondaryHover: '#7DD3FC',
    secondaryLight: '#082F49',
    secondaryGlass: 'rgba(56, 189, 248, 0.18)',
    
    tertiary: '#D8B4FE',
    tertiaryHover: '#E9D5FF',
    tertiaryLight: '#3B0764',
    tertiaryGlass: 'rgba(168, 85, 247, 0.18)',
    
    success: '#34D399',
    successLight: '#064E3B',
    successGlass: 'rgba(52, 211, 153, 0.18)',
    
    warning: '#FBBF24',
    warningLight: '#451A03',
    warningGlass: 'rgba(251, 191, 36, 0.18)',
    
    danger: '#FB7185',
    dangerLight: '#4C0519',
    dangerGlass: 'rgba(251, 113, 133, 0.18)',
    
    focusRing: '#B8D0FF',
    overlay: 'rgba(3, 7, 18, 0.8)',
    overlayStrong: 'rgba(3, 7, 18, 0.95)',
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans, "Inter", system-ui, sans-serif)',
    mono: 'var(--font-mono, "JetBrains Mono", monospace)',
    display: 'var(--font-display, "Cal Sans", "Inter", system-ui, sans-serif)',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
  md: '0 4px 8px -2px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.08)',
  lg: '0 12px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 40px -8px rgb(0 0 0 / 0.15), 0 8px 16px -8px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  focus: '0 0 0 3px rgb(59 130 246 / 0.4)',
  // Glass-specific shadows
  glass: '0 4px 24px 0 rgb(0 0 0 / 0.12), 0 1px 3px 0 rgb(0 0 0 / 0.08)',
  glassHover: '0 8px 32px 0 rgb(0 0 0 / 0.18), 0 2px 8px 0 rgb(0 0 0 / 0.12)',
  glassElevated: '0 16px 48px 0 rgb(0 0 0 / 0.25), 0 4px 16px 0 rgb(0 0 0 / 0.15)',
} as const;

export const blur = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
} as const;

export const transitions = {
  fast: '120ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const;

export const glass = {
  light: {
    bg: 'rgba(255, 255, 255, 0.85)',
    bgStrong: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(148, 163, 184, 0.3)',
    shadow: '0 4px 24px 0 rgb(0 0 0 / 0.12), 0 1px 3px 0 rgb(0 0 0 / 0.08)',
  },
  dark: {
    bg: 'rgba(15, 23, 42, 0.85)',
    bgStrong: 'rgba(15, 23, 42, 0.95)',
    border: 'rgba(148, 163, 184, 0.15)',
    shadow: '0 4px 24px 0 rgb(0 0 0 / 0.25), 0 1px 3px 0 rgb(0 0 0 / 0.1)',
  },
} as const;

// Component-specific tokens
export const componentTokens = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      sm: '0 0.875rem',
      md: '0 1.25rem',
      lg: '0 1.75rem',
    },
    fontSize: {
      sm: '0.8125rem',
      md: '0.9375rem',
      lg: '1rem',
    },
  },
  input: {
    height: {
      sm: '2rem',
      md: '2.5rem',
      lg: '3rem',
    },
    padding: '0 1rem',
  },
  card: {
    padding: '1.5rem',
    gap: '1.25rem',
  },
  modal: {
    maxWidth: '32rem',
    padding: '1.5rem',
  },
  sidebar: {
    width: '16rem',    // 256px
    widthCollapsed: '4rem', // 64px
  },
  header: {
    height: '4rem',    // 64px
  },
} as const;

export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Typography = typeof typography;
export type Shadows = typeof shadows;
export type Blur = typeof blur;
export type Transitions = typeof transitions;
export type Breakpoints = typeof breakpoints;
export type ZIndex = typeof zIndex;
export type Glass = typeof glass;