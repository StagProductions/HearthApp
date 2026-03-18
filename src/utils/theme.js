// src/utils/theme.js

export const colors = {
  cream: '#FAF7F2',
  warmWhite: '#FDF9F4',
  sand: '#E8E0D4',
  taupe: '#C4B5A0',
  brown: '#8B6F5E',
  darkBrown: '#4A3728',
  rust: '#C4622D',
  rustLight: '#F0DDD3',
  rustDark: '#9B4A1F',
  sage: '#7A8C6E',
  sageLight: '#E2EAD8',
  gold: '#D4A84B',
  goldLight: '#F5EDD8',
  textPrimary: '#2C1F14',
  textSecondary: '#7A6558',
  textMuted: '#A89888',
  border: 'rgba(139,111,94,0.15)',
  borderStrong: 'rgba(139,111,94,0.30)',
  white: '#FFFFFF',
  danger: '#C0392B',
  dangerLight: '#FDEAEA',
};

export const fonts = {
  regular: 'System',
  medium: 'System',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

export const shadows = {
  card: {
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Shift type config
export const shiftTypes = {
  morning: { label: 'Morning', emoji: '🌅', time: '6am – 2pm', color: colors.goldLight, textColor: '#7A5A1A' },
  evening: { label: 'Evening', emoji: '🌇', time: '2pm – 10pm', color: colors.rustLight, textColor: colors.rustDark },
  night:   { label: 'Night',   emoji: '🌙', time: '10pm – 6am', color: '#EAE6F0', textColor: '#4A3580' },
  off:     { label: 'Day off', emoji: '✓',  time: '',            color: colors.sageLight, textColor: colors.sage },
};

// Bill category config
export const billCategories = [
  { label: 'Home',      emoji: '🏠' },
  { label: 'Energy',    emoji: '⚡' },
  { label: 'Water',     emoji: '💧' },
  { label: 'Internet',  emoji: '🌐' },
  { label: 'Phone',     emoji: '📱' },
  { label: 'Insurance', emoji: '🛡️' },
  { label: 'Streaming', emoji: '📺' },
  { label: 'Transport', emoji: '🚗' },
  { label: 'Other',     emoji: '💳' },
];

// Document categories
export const docCategories = [
  { label: 'Important', color: colors.rustLight,  textColor: colors.rustDark },
  { label: 'Finance',   color: colors.goldLight,  textColor: '#7A5A1A' },
  { label: 'Home',      color: colors.sageLight,  textColor: colors.sage },
  { label: 'Medical',   color: '#EAE6F0',          textColor: '#4A3580' },
  { label: 'Other',     color: colors.sand,        textColor: colors.brown },
];
