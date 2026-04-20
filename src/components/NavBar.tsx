import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function NavBar() {
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    api.getMe().then((res) => {
      if (res.ok) setUser(res.data.user);
      setChecked(true);
    });
  }, []);

  const handleLogout = async () => {
    await api.logout();
    window.location.href = '/login';
  };

  if (!checked) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        <a href="/" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-orange-500">
          <span className="text-xl">🏠</span>
          <span className="text-[10px]">Home</span>
        </a>
        {user ? (
          <>
            <a href="/post/new" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-orange-500">
              <span className="text-xl">➕</span>
              <span className="text-[10px]">Post</span>
            </a>
            <a href={`/user/${user.id}`} className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-orange-500">
              <span className="text-xl">👤</span>
              <span className="text-[10px]">Me</span>
            </a>
          </>
        ) : (
          <a href="/login" className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-orange-500">
            <span className="text-xl">🔑</span>
            <span className="text-[10px]">Login</span>
          </a>
        )}
      </div>
    </nav>
  );
}
