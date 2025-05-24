'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ConfirmationPage() {
  const [message, setMessage] = useState('Please check your email to confirm your account.');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If already signed in, redirect to dashboard
        router.push('/dashboard');
      }
    };

    checkUserSession();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900">
      <div className="m-auto max-w-md p-8">
        <div className="rounded-xl bg-white p-8 shadow-xl dark:bg-gray-900">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold">Confirm Your Email</h1>
          </div>
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/sign-in')}
              className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}