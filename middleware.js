import { NextResponse } from 'next/server';

/**
 * ONYXRA — middleware
 *
 * Single-user mode: no login required. The middleware does nothing
 * except pass requests through. When we re-enable multi-user auth
 * later, we'll restore the redirect-to-/login logic here.
 */

export async function middleware(request) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|js/|sw.js|manifest.json|api/).*)',
  ],
};
