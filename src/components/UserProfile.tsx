'use client';

import { useAuth } from '@/components/AuthProvider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setIsDropdownOpen(false);
  };

  if (!user) return null;

  // Get user avatar from metadata or use initials
  const avatarUrl = user.user_metadata?.avatar_url;
  const userInitial = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center focus:outline-none"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User profile"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            {userInitial}
          </div>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium truncate">{user.email}</p>
          </div>

          <Link
            href="/dashboard"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Dashboard
          </Link>

          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Profile
          </Link>

          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}