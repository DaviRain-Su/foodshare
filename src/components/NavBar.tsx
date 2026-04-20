import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { avatarSrc } from '../lib/image';

export function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.getMe().then((res) => {
      if (res.ok) setUser(res.data.user);
      setChecked(true);
    });
  }, []);

  if (!checked) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-paper/90 backdrop-blur-md border-t border-ink/10 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        <a href="/feed" className="flex flex-col items-center gap-0.5 text-ink-3 hover:text-rust">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7.5L10 2l7 5.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V7.5z" /><path d="M7 18V11h6v7" /></svg>
          <span className="text-[10px] font-mono tracking-wider uppercase">Home</span>
        </a>
        {user ? (
          <>
            <a href="/post/new" className="flex flex-col items-center gap-0.5 text-ink-3 hover:text-rust">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="8" /><path d="M10 6v8M6 10h8" /></svg>
              <span className="text-[10px] font-mono tracking-wider uppercase">Post</span>
            </a>
            <a href={`/user/${user.id}`} className="flex flex-col items-center gap-0.5 text-ink-3 hover:text-rust">
              {avatarSrc(user.avatar_url) ? (
                <img src={avatarSrc(user.avatar_url)!} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="7" r="4" /><path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" /></svg>
              )}
              <span className="text-[10px] font-mono tracking-wider uppercase">Me</span>
            </a>
          </>
        ) : (
          <a href="/login" className="flex flex-col items-center gap-0.5 text-ink-3 hover:text-rust">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="8" width="12" height="10" rx="2" /><path d="M7 8V5a3 3 0 016 0v3" /></svg>
            <span className="text-[10px] font-mono tracking-wider uppercase">Login</span>
          </a>
        )}
      </div>
    </nav>
  );
}
