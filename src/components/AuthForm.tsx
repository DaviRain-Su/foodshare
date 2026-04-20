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
    if (res.ok) {
      window.location.href = '/';
    } else {
      setError(res.data.error?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-center">Login</h1>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <p className="text-center text-sm text-gray-500">
        No account? <a href="/register" className="text-orange-500 hover:underline">Register</a>
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
    if (res.ok) {
      window.location.href = '/';
    } else {
      setError(res.data.error?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold text-center">Register</h1>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <input
        type="text"
        placeholder="Nickname (2-20 chars)"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
        minLength={2}
        maxLength={20}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <input
        type="password"
        placeholder="Password (8+ chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        maxLength={72}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
      <p className="text-center text-sm text-gray-500">
        Have an account? <a href="/login" className="text-orange-500 hover:underline">Login</a>
      </p>
    </form>
  );
}
