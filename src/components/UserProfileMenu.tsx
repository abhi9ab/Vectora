'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, Settings, Shield, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export default function UserProfileMenu({ user, avatarUrl, userName }: {
  user: User;
  avatarUrl?: string;
  userName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-all duration-200 hover:scale-105"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.email || 'User profile'}
            className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold shadow-md border-2 border-white">
            {getInitials(userName)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-900 dark:ring-gray-700 border border-gray-100 dark:border-gray-800 animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.email || 'User profile'}
                  className="h-12 w-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold border-2 border-gray-200 dark:border-gray-700">
                  {getInitials(userName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {userName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Manage account</span>
            </Link>

            <Link
              href="/security"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Security</span>
            </Link>

            <Link
              href="/billing"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <CreditCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Billing</span>
            </Link>

            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Notifications</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-3 px-6 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
            >
              <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 py-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-6 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-150 font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}