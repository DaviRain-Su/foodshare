import { useState, useEffect } from 'react';
import { SearchPanel } from './Search';

export function FeedHeader() {
  const [showSearch, setShowSearch] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('foodshare_theme', next ? 'dark' : 'light');
    const meta = document.getElementById('theme-color-meta') as HTMLMetaElement;
    if (meta) meta.content = next ? '#1a1714' : '#f5efe3';
  };

  return (
    <>
      <header className="bg-paper/90 backdrop-blur-md border-b border-ink/8 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center">
          <h1 className="text-xl font-display text-ink">FoodShare</h1>
          <span className="text-sm font-hand text-ink-4 ml-2 mt-1">&middot; food diary</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-rust rounded-lg hover:bg-paper-2"
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="4"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.3 13.3A8 8 0 016.7 2.7 8 8 0 1017.3 13.3z"/></svg>
              )}
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="w-8 h-8 flex items-center justify-center text-ink-3 hover:text-rust rounded-lg hover:bg-paper-2"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8.5" cy="8.5" r="6"/><path d="M13.5 13.5L18 18"/></svg>
            </button>
          </div>
        </div>
      </header>
      {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}
    </>
  );
}
