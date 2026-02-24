'use client';

import React, { useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeToggleProps {
  inline?: boolean;
}

const ThemeToggle = ({ inline = false }: ThemeToggleProps) => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as ThemeMode | null) ?? 'dark';
    const initial = stored === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', initial);
    setTheme(initial);
    setReady(true);
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  if (!ready) {
    return null;
  }

  const baseStyle: React.CSSProperties = {
    border: '1px solid var(--border-color)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    borderRadius: '999px',
    padding: '8px 14px',
    fontSize: '0.86rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 6px 16px var(--shadow-color)',
    whiteSpace: 'nowrap',
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        ...baseStyle,
        ...(inline
          ? {}
          : {
              position: 'fixed',
              top: '14px',
              right: '14px',
              zIndex: 1000,
            }),
      }}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
};

export default ThemeToggle;
