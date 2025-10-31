import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor =
  | 'lime'
  | 'yellow'
  | 'blue'
  | 'purple'
  | 'red'
  | 'green'
  | 'orange'
  | 'pink'
  | 'teal'
  | 'brown'
  | 'gray'
  | 'indigo';

interface ThemeState {
  mode: ThemeMode;
  color: ThemeColor;
  dynamicNodeSizing: boolean;
  setMode: (mode: ThemeMode) => void;
  setColor: (color: ThemeColor) => void;
  setDynamicNodeSizing: (enabled: boolean) => void;
  applyTheme: () => void;
}

const themeColors: Record<ThemeColor, { light: string; dark: string }> = {
  lime: {
    light: '84 81% 44%',
    dark: '84 81% 50%',
  },
  yellow: {
    light: '45 93% 47%',
    dark: '45 93% 55%',
  },
  blue: {
    light: '217 91% 60%',
    dark: '217 91% 65%',
  },
  purple: {
    light: '262 83% 58%',
    dark: '262 83% 65%',
  },
  red: {
    light: '0 84% 60%',
    dark: '0 84% 65%',
  },
  green: {
    light: '142 76% 36%',
    dark: '142 76% 45%',
  },
  orange: {
    light: '24 95% 53%',
    dark: '24 95% 60%',
  },
  pink: {
    light: '330 81% 60%',
    dark: '330 81% 70%',
  },
  teal: {
    light: '174 63% 41%',
    dark: '174 63% 50%',
  },
  brown: {
    light: '30 30% 40%',
    dark: '30 30% 50%',
  },
  gray: {
    light: '210 10% 60%',
    dark: '210 10% 70%',
  },
  indigo: {
    light: '243 75% 59%',
    dark: '243 75% 65%',
  },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      color: 'lime',
      dynamicNodeSizing: true,

      setMode: (mode) => {
        set({ mode });
        get().applyTheme();
      },

      setColor: (color) => {
        set({ color });
        get().applyTheme();
      },

      setDynamicNodeSizing: (enabled) => {
        set({ dynamicNodeSizing: enabled });
      },

      applyTheme: () => {
        const { mode, color } = get();
        const root = document.documentElement;

        let isDark = false;
        if (mode === 'system') {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
          isDark = mode === 'dark';
        }

        root.classList.toggle('dark', isDark);

        const colorValue = isDark ? themeColors[color].dark : themeColors[color].light;
        root.style.setProperty('--primary', colorValue);

        root.style.setProperty('--ring', colorValue);
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);

if (typeof window !== 'undefined') {
  const store = useThemeStore.getState();
  store.applyTheme();

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (store.mode === 'system') {
      store.applyTheme();
    }
  });
}
