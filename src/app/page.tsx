import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from "@/components/landing-page/LandingPage";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  // Show landing page for non-authenticated users
  return <LandingPage />;
}