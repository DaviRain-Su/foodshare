import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
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
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
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
    if (res.ok) {
      setMessage('Saved!');
      setUser(res.data.user);
    } else {
      setMessage(res.data.error?.message || 'Failed');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    window.location.href = '/login';
  };

  if (!user) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => fileRef.current?.click()}
          className="w-16 h-16 bg-orange-200 rounded-full flex items-center justify-center text-xl font-bold text-orange-700 cursor-pointer overflow-hidden hover:opacity-80"
        >
          {avatarPreview || user.avatar_url
            ? <img src={avatarPreview || user.avatar_url} alt="" className="w-full h-full object-cover" />
            : user.nickname[0]}
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-orange-500 hover:underline">Change avatar</button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
      </div>

      <input
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        minLength={CONSTANTS.NICKNAME_MIN_LENGTH}
        maxLength={CONSTANTS.NICKNAME_MAX_LENGTH}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <textarea
        placeholder="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        maxLength={CONSTANTS.BIO_MAX_LENGTH}
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
      />

      {message && <p className={`text-sm ${message === 'Saved!' ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
      >
        Logout
      </button>
    </form>
  );
}
