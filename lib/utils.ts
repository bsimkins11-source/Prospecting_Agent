import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from './constants';

// Style utility functions
export const createButtonStyle = (variant: 'primary' | 'secondary' = 'primary', disabled = false) => ({
  backgroundColor: disabled ? COLORS.text.muted : variant === 'primary' ? COLORS.primary : 'transparent',
  color: disabled ? 'white' : variant === 'primary' ? 'white' : COLORS.primary,
  border: variant === 'secondary' ? `1px solid ${COLORS.border}` : 'none',
  borderRadius: BORDER_RADIUS.md,
  padding: `${SPACING.sm} ${SPACING.md}`,
  fontSize: TYPOGRAPHY.small.fontSize,
  fontWeight: '500',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s ease',
  opacity: disabled ? 0.6 : 1
});

export const createInputStyle = (focused = false) => ({
  width: '100%',
  padding: SPACING.sm,
  border: `1px solid ${focused ? COLORS.primary : COLORS.border}`,
  borderRadius: BORDER_RADIUS.md,
  fontSize: TYPOGRAPHY.small.fontSize,
  outline: 'none',
  transition: 'border-color 0.2s ease',
  backgroundColor: 'white'
});

export const createCardStyle = (variant: 'base' | 'header' = 'base') => ({
  backgroundColor: variant === 'header' ? COLORS.surface : COLORS.background,
  borderRadius: variant === 'header' ? `${BORDER_RADIUS.lg} ${BORDER_RADIUS.lg} 0 0` : BORDER_RADIUS.lg,
  border: `1px solid ${COLORS.border}`,
  padding: SPACING.lg,
  boxShadow: SHADOWS.sm,
  ...(variant === 'header' && { borderBottom: `1px solid ${COLORS.border}` })
});

export const createSectionHeaderStyle = () => ({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: SPACING.md
});

export const createTypographyStyle = (variant: keyof typeof TYPOGRAPHY) => ({
  ...TYPOGRAPHY[variant],
  margin: 0,
  color: COLORS.text.primary
});

// Utility functions
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const createLoadingSpinner = () => ({
  width: '12px',
  height: '12px',
  border: `2px solid ${COLORS.text.muted}`,
  borderTop: `2px solid transparent`,
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
});
