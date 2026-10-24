import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = ['/dashboard', '/expenses', '/tasks', '/pomodoro', '/routines', '/schedule', '/settings'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // Auth routes
  const authPaths = ['/login', '/signup'];
  const isAuthPath = authPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // Redirect unauthenticated users from protected routes
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Prevent caching of the redirect response
    redirectResponse.headers.set('Cache-Control', 'no-store, must-revalidate, private');
    return redirectResponse;
  }

  // Redirect authenticated users from auth routes
  if (isAuthPath && session) {
    const redirect = req.nextUrl.searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(new URL(redirect, req.url));
  }

  // Add cache-control headers for protected routes to prevent bfcache restoring stale authenticated content
  if (isProtectedPath) {
    res.headers.set('Cache-Control', 'no-store, must-revalidate, private');
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/expenses/:path*',
    '/tasks/:path*',
    '/pomodoro/:path*',
    '/routines/:path*',
    '/schedule/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
};