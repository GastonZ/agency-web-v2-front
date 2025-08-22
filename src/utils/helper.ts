export const TOKEN_KEY = "aiaToken";

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? "";
export const saveToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

type Theme = 'light' | 'dark' | 'system';

export function setTheme(t: Theme) {
  if (t === 'light') {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  } else if (t === 'dark') {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  } else {
    localStorage.removeItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
  }
}

let bound = false;
export function bindSystemThemeListener() {
  if (bound) return;
  bound = true;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener?.('change', () => {
    const stored = localStorage.getItem('theme');
    if (!stored) {
      document.documentElement.classList.toggle('dark', mq.matches);
    }
  });
}
