import { useState } from 'react';
import { api } from '../lib/api';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.login(email, password);
    setLoading(false);
    if (res.ok) { window.location.href = '/'; }
    else { setError(res.data.error?.message || 'Login failed'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-display text-ink">FoodShare</h1>
        <p className="text-sm font-hand text-ink-3 mt-1 text-lg">Login</p>
      </div>
      {error && <p className="text-rust text-sm text-center font-serif">{error}</p>}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
        className="w-full px-4 py-2.5 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/40" />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
        className="w-full px-4 py-2.5 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/40" />
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-rust text-white rounded-xl font-serif font-medium hover:bg-rust-deep disabled:opacity-50 transition-colors">
        {loading ? '...' : 'Login'}
      </button>
      <p className="text-center text-sm text-ink-4 font-serif">
        No account? <a href="/register" className="text-rust hover:underline">Register</a>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.register(email, password, nickname);
    setLoading(false);
    if (res.ok) { window.location.href = '/'; }
    else { setError(res.data.error?.message || 'Registration failed'); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-display text-ink">FoodShare</h1>
        <p className="text-sm font-hand text-ink-3 mt-1 text-lg">Register</p>
      </div>
      {error && <p className="text-rust text-sm text-center font-serif">{error}</p>}
      <input type="text" placeholder="Nickname (2-20 chars)" value={nickname} onChange={(e) => setNickname(e.target.value)} required minLength={2} maxLength={20}
        className="w-full px-4 py-2.5 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/40" />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
        className="w-full px-4 py-2.5 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/40" />
      <input type="password" placeholder="Password (8+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} maxLength={72}
        className="w-full px-4 py-2.5 bg-white/60 border border-ink/12 rounded-xl font-serif text-sm focus:outline-none focus:ring-2 focus:ring-rust/30 focus:border-rust/40" />
      <button type="submit" disabled={loading}
        className="w-full py-2.5 bg-rust text-white rounded-xl font-serif font-medium hover:bg-rust-deep disabled:opacity-50 transition-colors">
        {loading ? '...' : 'Register'}
      </button>
      <p className="text-center text-sm text-ink-4 font-serif">
        Have an account? <a href="/login" className="text-rust hover:underline">Login</a>
      </p>
    </form>
  );
}
