import { NextRequest, NextResponse } from 'next/server';

const protectedPrefixes = ['/entreprises', '/administration'];
const authCookieNames = ['sb-access-token', 'supabase-auth-token', 'mlexpert-session'];

function hasAuthCookie(request: NextRequest) {
  return authCookieNames.some((name) => Boolean(request.cookies.get(name)?.value));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!isProtected || hasAuthCookie(request)) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/entreprises/:path*', '/administration/:path*']
};
