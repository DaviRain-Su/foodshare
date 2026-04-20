import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { avatarSrc } from '../lib/image';
import { CONSTANTS } from '../lib/constants';

export function Settings() {
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getMe().then((res) => {
      if (res.ok) {
        setUser(res.data.user);
        setNickname(res.data.user.nickname);
        setBio(res.data.user.bio || '');
      } else {
        window.location.href = '/login';
      }
    });
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData();
    form.append('nickname', nickname);
    form.append('bio', bio);
    if (avatarFile) form.append('avatar', avatarFile);
    const res = await api.updateProfile(form);
    setLoading(false);
    if (res.ok) { setMessage('Saved!'); setUser(res.data.user); }
    else { setMessage(res.data.error?.message || 'Failed'); }
  };

  const handleLogout = async () => {
    await api.logout();
    window.location.href = '/login';
  };

  if (!user) return <div className="text-center py-8 text-ink-4 font-serif">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-5">
      <h1 className="text-xl font-display text-ink">Settings</h1>

      <div className="flex items-center gap-4">
        <div onClick={() => fileRef.current?.click()}
          className="w-16 h-16 bg-paper-3 rounded-full flex items-center justify-center text-xl font-display text-ink-3 cursor-pointer overflow-hidden hover:opacity-80">
          {avatarPreview || avatarSrc(user.avatar_url)
            ? <img src={avatarPreview || avatarSrc(user.avatar_url)!} alt="" className="w-full h-full object-cover" />
            : user.nickname[0]}
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-rust font-serif hover:underline">Change avatar</button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
      </div>

      <input placeholder="Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)}
        minLength={CONSTANTS.NICKNAME_MIN_LENGTH} maxLength={CONSTANTS.NICKNAME_MAX_LENGTH} required
        className="w-full px-4 py-2.5 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30" />
      <textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)}
        maxLength={CONSTANTS.BIO_MAX_LENGTH} rows={3}
        className="w-full px-4 py-2.5 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30 resize-none" />

      {message && <p className={`text-sm font-serif ${message === 'Saved!' ? 'text-olive' : 'text-rust'}`}>{message}</p>}

      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-rust text-white rounded-xl font-serif font-medium hover:bg-rust-deep disabled:opacity-50 transition-colors">
        {loading ? 'Saving...' : 'Save'}
      </button>

      <button type="button" onClick={handleLogout}
        className="w-full py-2.5 border border-ink/15 text-ink-3 rounded-xl text-sm font-serif hover:bg-paper-2 transition-colors">
        Logout
      </button>
    </form>
  );
}
