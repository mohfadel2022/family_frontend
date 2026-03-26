import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/reset-password', '/logout'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes through
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // Check for auth token in cookies
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
        // Not authenticated → redirect to login
        const loginUrl = new URL('/login', request.url);
        // Preserve the intended destination so we can redirect back after login
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Match all routes except Next.js internals and static files
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
