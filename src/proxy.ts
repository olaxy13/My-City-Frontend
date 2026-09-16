import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();
  const { pathname, search } = req.nextUrl;

  const isAdminSubdomain = hostname.startsWith('admin.');

  if (isAdminSubdomain) {
    // Convenience aliases for admin subdomain
    if (pathname === '/' || pathname === '/login') {
      return NextResponse.redirect(new URL(`/admin${search}`, req.url));
    }
    if (pathname === '/moderation' || pathname === '/dashboard') {
      return NextResponse.redirect(new URL(`/admin/moderation${search}`, req.url));
    }
    if (pathname === '/featured') {
      return NextResponse.redirect(new URL(`/admin/featured${search}`, req.url));
    }

    // If accessing any other non-admin route on the admin subdomain, keep admin contained in /admin
    if (!pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL(`/admin${search}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - static files (favicon, webp, png, svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
