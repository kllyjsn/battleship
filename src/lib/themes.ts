export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  vars: Record<string, string>;
}

const THEMES: ThemeConfig[] = [
  {
    id: 'classic',
    name: 'Classic CRT',
    description: 'Dark blue/green retro terminal',
    vars: {
      '--board-bg': '#0a0e1a',
      '--board-border': '#1a2535',
      '--cell-empty': '#0d1520',
      '--cell-empty-border': '#1a2535',
      '--cell-hit': 'rgba(127, 29, 29, 0.6)',
      '--cell-miss': '#111a28',
      '--cell-sunk': 'rgba(127, 29, 29, 0.7)',
      '--cell-ship': '#2a3040',
      '--cell-ship-border': '#3a4a5a',
      '--grid-line': '#1a2535',
      '--cell-hover': '#142030',
      '--cell-hover-border': 'rgba(74, 222, 128, 0.3)',
      '--text-primary': '#39ff14',
      '--text-secondary': 'rgba(74, 222, 128, 0.5)',
    },
  },
  {
    id: 'sonar',
    name: 'Sonar',
    description: 'Dark green high-contrast sonar',
    vars: {
      '--board-bg': '#040d04',
      '--board-border': '#0a2a0a',
      '--cell-empty': '#061206',
      '--cell-empty-border': '#0a2a0a',
      '--cell-hit': 'rgba(180, 40, 10, 0.7)',
      '--cell-miss': '#081408',
      '--cell-sunk': 'rgba(160, 30, 10, 0.8)',
      '--cell-ship': '#0f2a0f',
      '--cell-ship-border': '#1a4a1a',
      '--grid-line': '#0a2a0a',
      '--cell-hover': '#0f2a0f',
      '--cell-hover-border': 'rgba(57, 255, 20, 0.4)',
      '--text-primary': '#39ff14',
      '--text-secondary': 'rgba(57, 255, 20, 0.4)',
    },
  },
  {
    id: 'satellite',
    name: 'Satellite',
    description: 'Blue ocean with white grid lines',
    vars: {
      '--board-bg': '#0c2340',
      '--board-border': '#1a4a7a',
      '--cell-empty': '#0f2d50',
      '--cell-empty-border': '#1a4a7a',
      '--cell-hit': 'rgba(200, 50, 30, 0.7)',
      '--cell-miss': '#0c2845',
      '--cell-sunk': 'rgba(180, 40, 20, 0.8)',
      '--cell-ship': '#1a3d60',
      '--cell-ship-border': '#2a5a80',
      '--grid-line': '#1a4a7a',
      '--cell-hover': '#1a3d60',
      '--cell-hover-border': 'rgba(100, 200, 255, 0.4)',
      '--text-primary': '#60c0ff',
      '--text-secondary': 'rgba(100, 180, 255, 0.5)',
    },
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Ice blue and white palette',
    vars: {
      '--board-bg': '#e8f0f8',
      '--board-border': '#b0c8e0',
      '--cell-empty': '#dce8f4',
      '--cell-empty-border': '#b0c8e0',
      '--cell-hit': 'rgba(200, 50, 30, 0.6)',
      '--cell-miss': '#d0dcea',
      '--cell-sunk': 'rgba(160, 30, 10, 0.7)',
      '--cell-ship': '#c0d4e8',
      '--cell-ship-border': '#90b0d0',
      '--grid-line': '#b0c8e0',
      '--cell-hover': '#c8daf0',
      '--cell-hover-border': 'rgba(40, 100, 180, 0.4)',
      '--text-primary': '#1a5090',
      '--text-secondary': 'rgba(40, 80, 140, 0.6)',
    },
  },
];

const STORAGE_KEY = 'battleship-theme';

export function getAllThemes(): ThemeConfig[] {
  return THEMES;
}

export function getTheme(themeId: string): ThemeConfig {
  return THEMES.find((t) => t.id === themeId) || THEMES[0];
}

export function loadTheme(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'classic';
  } catch {
    return 'classic';
  }
}

export function saveTheme(themeId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // ignore
  }
}

export function applyTheme(themeId: string): void {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }
}
