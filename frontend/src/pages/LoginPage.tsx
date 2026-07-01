import { useState } from 'react';
import { login, signup } from '../lib/auth';

interface LoginPageProps {
  onSuccess: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await signup(email, name, password);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center"
         style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))' }}>
      <div className="w-full max-w-md bg-black/80 rounded-lg p-10">
        <h1 className="text-red-600 text-3xl font-black mb-6">STREAMR</h1>
        <h2 className="text-white text-2xl font-bold mb-6">
          {mode === 'login' ? 'Sign In' : 'Sign Up'}
        </h2>

        {error && (
          <div className="bg-orange-500/20 border border-orange-500 text-orange-200
            text-sm rounded p-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-neutral-700 text-white rounded px-4 py-3
              outline-none focus:ring-2 focus:ring-white/30"
          />

          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-neutral-700 text-white rounded px-4 py-3
                outline-none focus:ring-2 focus:ring-white/30"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-neutral-700 text-white rounded px-4 py-3
              outline-none focus:ring-2 focus:ring-white/30"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold
              py-3 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </div>

        <p className="text-neutral-400 text-sm mt-6">
          {mode === 'login' ? "New to Streamr? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-white hover:underline"
          >
            {mode === 'login' ? 'Sign up now' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
