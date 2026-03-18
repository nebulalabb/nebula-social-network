import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
const PROTECTED_ROUTES = ['/feed', '/profile', '/settings', '/notifications', '/messages'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('accessToken')?.value 
    || request.headers.get('authorization')?.replace('Bearer ', '');

  // Check localStorage token via cookie set by client
  const isAuthenticated = !!accessToken;

  const isAuthRoute = PUBLIC_AUTH_ROUTES.some(route => pathname.startsWith(route));
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // Nếu đã đăng nhập mà vào trang Auth → redirect về /
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Nếu chưa đăng nhập mà vào Protected route → redirect về /login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};
