import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Explicitly set trailingSlash to match next.config.js
  trailingSlash: false
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude Next.js internals and static assets - CRITICAL for preventing 404s
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.(.*)$/.test(pathname) // Matches any file with extension (e.g., .js, .css, .png)
  ) {
    return NextResponse.next();
  }

  // Redirect root path to default locale
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url);
  }

  // Apply next-intl middleware for all other routes
  return intlMiddleware(request);
}

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};


