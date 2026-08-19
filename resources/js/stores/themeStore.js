import { create } from 'zustand';

const KEY = 'wa-erp-theme';
const media = window.matchMedia('(prefers-color-scheme: dark)');

// تطبيق الثيم على <html>: كلاس صريح للاختيار اليدوي، وبلا كلاس لِـ "حسب النظام"
function apply(theme) {
  const root = document.documentElement;
  root.classList.remove('dark', 'light');
  if (theme === 'dark' || theme === 'light') root.classList.add(theme);
}

function resolve(theme) {
  return theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
}

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem(KEY) || 'system',
  resolved: 'light',

  init: () => {
    const theme = get().theme;
    apply(theme);
    set({ resolved: resolve(theme) });
    media.addEventListener('change', () => {
      if (get().theme === 'system') set({ resolved: resolve('system') });
    });
  },

  setTheme: (theme) => {
    localStorage.setItem(KEY, theme);
    apply(theme);
    set({ theme, resolved: resolve(theme) });
  },

  cycle: () => {
    const order = ['system', 'light', 'dark'];
    get().setTheme(order[(order.indexOf(get().theme) + 1) % order.length]);
  },
}));
