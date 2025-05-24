import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';

export default async function ProfilePage() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/sign-in');
  }

  const user = session.user;
  const avatarUrl = user.user_metadata.avatar_url;
  const name = user.user_metadata.full_name || user.user_metadata.name;
  const email = user.email;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto mt-8">
        <div className="mb-4">
          <Link href="/dashboard" className="text-white hover:underline flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold mb-6">User Profile</h1>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-lg font-medium">{name || 'User'}</h2>
                <p className="text-gray-500 dark:text-gray-400">{email}</p>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium mb-2">Account Information</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Provider: {user.app_metadata.provider || 'Email'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}