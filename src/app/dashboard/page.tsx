import UserProfileMenu from '@/components/UserProfileMenu';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react'

type Props = {}

export default async function Dashboard() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/sign-in');
  }

  const user = session.user;
  const avatarUrl = user.user_metadata.avatar_url;
  const userName = user.user_metadata.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="flex items-center justify-center">
      <UserProfileMenu
        user={user}
        avatarUrl={avatarUrl}
        userName={userName}
      />
    </div>
  )
}
