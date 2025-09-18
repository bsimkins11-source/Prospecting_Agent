// UI Constants
export const COLORS = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  background: '#ffffff',
  surface: '#f9fafb',
  border: '#e5e7eb',
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    muted: '#9ca3af'
  }
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem'
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: '2rem',
    fontWeight: 'bold',
    lineHeight: '1.2'
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    lineHeight: '1.3'
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    lineHeight: '1.4'
  },
  body: {
    fontSize: '1rem',
    lineHeight: '1.5'
  },
  small: {
    fontSize: '0.875rem',
    lineHeight: '1.4'
  }
} as const;

export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px'
} as const;

export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
} as const;

// Component Styles
export const BUTTON_STYLES = {
  primary: {
    backgroundColor: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: BORDER_RADIUS.md,
    padding: `${SPACING.sm} ${SPACING.md}`,
    fontSize: TYPOGRAPHY.small.fontSize,
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  secondary: {
    backgroundColor: 'transparent',
    color: COLORS.primary,
    border: `1px solid ${COLORS.border}`,
    borderRadius: BORDER_RADIUS.md,
    padding: `${SPACING.sm} ${SPACING.md}`,
    fontSize: TYPOGRAPHY.small.fontSize,
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
} as const;

export const INPUT_STYLES = {
  base: {
    width: '100%',
    padding: SPACING.sm,
    border: `1px solid ${COLORS.border}`,
    borderRadius: BORDER_RADIUS.md,
    fontSize: TYPOGRAPHY.small.fontSize,
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  focus: {
    borderColor: COLORS.primary
  }
} as const;

export const CARD_STYLES = {
  base: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    border: `1px solid ${COLORS.border}`,
    padding: SPACING.lg,
    boxShadow: SHADOWS.sm
  },
  header: {
    backgroundColor: COLORS.surface,
    borderBottom: `1px solid ${COLORS.border}`,
    padding: SPACING.md,
    borderRadius: `${BORDER_RADIUS.lg} ${BORDER_RADIUS.lg} 0 0`
  }
} as const;
