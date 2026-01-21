import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localeDetection: true, // Use Accept-Language and NEXT_LOCALE cookie on first visit
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

  // Explicitly handle root path - redirect to default locale
  // This ensures Cloudflare Pages handles the root route correctly
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // Redirect removed /stats and /docs to home (/:locale)
  const match = pathname.match(/^\/(en|ku|ar)\/(stats|docs)\/?$/);
  if (match) {
    return NextResponse.redirect(new URL(`/${match[1]}`, request.url));
  }

  // Protect /[locale]/admin (except /[locale]/admin/login): require admin_session cookie
  if (pathname.match(/^\/(en|ku|ar)\/admin(\/.*)?$/) && !pathname.endsWith('/admin/login')) {
    const adminSession = request.cookies.get('admin_session')?.value;
    if (!adminSession) {
      const locale = pathname.split('/')[1] || 'en';
      return NextResponse.redirect(new URL(`/${locale}/admin/login`, request.url));
    }
  }

  // Let next-intl handle locale routing for all other paths
  return intlMiddleware(request);
}

export const config = {
  // Match all routes except Next.js internals and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};


