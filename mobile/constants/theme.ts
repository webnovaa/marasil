/**
 * WhatsApp API SaaS - Mobile Design Tokens and Brand Colors
 * Emerald (#10b981), Dark Navy (#0B132B), Slate (#1e293b), Gold (#f59e0b)
 */

import { Platform } from 'react-native';

const brandEmerald = '#10b981';
const brandEmeraldDark = '#059669';

export const Colors = {
  light: {
    text: '#0f172a',
    textMuted: '#64748b',
    textSubtle: '#94a3b8',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSoft: '#f1f5f9',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    tint: brandEmeraldDark,
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: brandEmeraldDark,
    tabBarBackground: '#ffffff',
    primary: brandEmeraldDark,
    primaryLight: '#ecfdf5',
    accent: '#f59e0b',
    danger: '#ef4444',
    dangerLight: '#fef2f2',
    success: '#10b981',
    successLight: '#f0fdf4',
  },
  dark: {
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textSubtle: '#64748b',
    background: '#0B132B',
    surface: '#172554',
    surfaceSoft: '#1e293b',
    border: '#334155',
    borderStrong: '#475569',
    tint: brandEmerald,
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: brandEmerald,
    tabBarBackground: '#0F172A',
    primary: brandEmerald,
    primaryLight: 'rgba(16, 185, 129, 0.15)',
    accent: '#f59e0b',
    danger: '#f87171',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    success: '#34d399',
    successLight: 'rgba(16, 185, 129, 0.15)',
  },
};

export const Brand = {
  name: 'مراسيل',
  fullName: 'مراسيل - WhatsApp API SaaS',
  tagline: 'منصة الربط والأتمتة الذكية للواتساب',
  defaultApiUrl: (process.env.EXPO_PUBLIC_API_URL || 'https://marasil.cloud').replace(/\/+$/, ''),
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
