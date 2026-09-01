export const brand = {
  nameKey: 'product.name',
  /** Display fallback — prefer VITE_APP_NAME / config at runtime */
  defaultDisplayName: 'Marasil',
  arabicDisplayName: 'مراسيل',
  designSystemCodename: 'Marasil',
  products: {
    api: 'Marasil API',
    console: 'Marasil Console',
    docs: 'Marasil Docs',
    connect: 'Marasil Connect',
  },
  /** Arabic label when app name is the English default. */
  displayName(appName: string): string {
    return appName === brand.defaultDisplayName ? brand.arabicDisplayName : appName;
  },
  /** Sidebar/header monogram. */
  monogram(appName: string): string {
    return appName === brand.defaultDisplayName ? 'م' : appName.slice(0, 1);
  },
} as const;

export const brandColors = {
  primary: 'rgb(var(--brand-900))',
  primaryHover: 'rgb(var(--brand-800))',
  primaryPressed: 'rgb(var(--brand-950))',
  accent: 'rgb(var(--accent-400))',
  ink: 'rgb(var(--brand-950))',
} as const;

export type ThemeDirection = 'rtl' | 'ltr';

export const defaultTheme = {
  direction: 'rtl' as ThemeDirection,
  locale: 'ar',
};

/** Read CSS custom property from document (client-only). */
export function readCssVar(name: string, fallback = ''): string {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Inertia progress bar color from central token (hex). */
export function getInertiaProgressColor(): string {
  return readCssVar('--brand-900-hex', '#321A39');
}

/** @deprecated Prefer brand.displayName() */
export function displayBrandName(appName: string): string {
  return brand.displayName(appName);
}

/** @deprecated Prefer brand.monogram() */
export function brandMonogram(appName: string): string {
  return brand.monogram(appName);
}
