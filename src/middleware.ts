import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile'];
  const path = request.nextUrl.pathname;

  // Check if the route is protected and redirect to sign-in if no session
  if (protectedRoutes.some(route => path.startsWith(route)) && !session) {
    const redirectUrl = new URL('/sign-in', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is already signed in and trying to access auth pages, redirect to dashboard
  if ((path === '/sign-in' || path === '/sign-up') && session) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If at root and logged in, redirect to dashboard
  if (path === '/' && session) {
    const redirectUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};