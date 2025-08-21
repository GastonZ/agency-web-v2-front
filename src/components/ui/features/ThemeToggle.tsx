import { useEffect, useState } from 'react';
import { setTheme } from '../../../utils/helper';

type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) ?? 'system';
  });

  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-1">
      {(['light','dark','system'] as Theme[]).map((t) => (
        <button
          key={t}
          onClick={() => setLocal(t)}
          className={`px-3 py-1 rounded-lg text-sm
            ${theme === t
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-700/60'}
          `}
        >
          {t === 'light' ? 'Claro' : t === 'dark' ? 'Oscuro' : 'Sistema'}
        </button>
      ))}
    </div>
  );
}
