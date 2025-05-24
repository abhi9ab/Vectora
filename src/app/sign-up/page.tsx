'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Show confirmation message or redirect
      router.push('/sign-up/confirmation');
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleGithubSignUp = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900">
      {/* Left Section */}
      <div className="relative hidden w-1/2 p-8 lg:block">
        <div className="h-full w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-purple-400 via-purple-600 to-black p-8">
          <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white">
            <div className="mb-8">
              <h1 className="font-dancing-script text-4xl font-semibold">Vectora</h1>
            </div>
            <h2 className="mb-6 text-4xl font-bold">Research Smarter</h2>
            <p className="mb-12 text-lg">An AI-powered research assistant with RAG capabilities for comprehensive insights.</p>

            <div className="w-full max-w-sm space-y-4">
              <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black">1</span>
                  <span className="text-lg">Create your account</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                    2
                  </span>
                  <span className="text-lg">Set up your research profile</span>
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white">
                    3
                  </span>
                  <span className="text-lg">Start exploring with AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section with Supabase Auth */}
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="w-full max-w-md p-4 md:p-8">
          <div className="shadow-xl rounded-xl w-full bg-white dark:bg-gray-900 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Create an Account</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Join Vectora to enhance your research capabilities</p>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <button
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all mb-3"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {loading ? 'Loading...' : 'Continue with Google'}
              </button>

              <button
                onClick={handleGithubSignUp}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {loading ? 'Loading...' : 'Continue with GitHub'}
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleEmailSignUp}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                  required
                />
              </div>
              <div className="mb-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                  {loading ? 'Loading...' : 'Sign Up'}
                </button>
              </div>
            </form>

            <div className="text-sm text-center">
              <p>
                Already have an account?{' '}
                <Link
                  href="/sign-in"
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}