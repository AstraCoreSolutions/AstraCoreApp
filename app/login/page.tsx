'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

/**
 * A simple login form that uses Supabase email/password authentication.
 * After a successful sign in the user is redirected to the dashboard.
 */
export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      router.push('/dashboard');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Sign in</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 text-white rounded"
        >
          Sign In
        </button>
      </form>
    </main>
  );
}
