'use client';

import { useAuth } from '@/components/AuthProvider';

export default function LogoutButton() {
  const { signOut } = useAuth();
  
  return (
    <button
      onClick={signOut}
      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    >
      Sign Out
    </button>
  );
}