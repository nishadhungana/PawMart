import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const forwardedProtocol = req.headers.get('x-forwarded-proto');
  const isHttps = req.nextUrl.protocol === 'https:' || forwardedProtocol === 'https';

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = req.nextUrl;

  // TLS terminates at the hosting platform/reverse proxy. Local development remains HTTP.
  if (isProduction && (pathname === '/checkout' || pathname.startsWith('/api/orders')) && !isHttps) {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = 'https:';
    return withSecurityHeaders(NextResponse.redirect(httpsUrl), isProduction);
  }

  // Paths requiring authentication and role check
  const isSellerPath = pathname.startsWith('/seller');
  const isVetPath = pathname.startsWith('/vet');
  const isAdminPath = pathname.startsWith('/admin');
  const isCustomerPath = pathname.startsWith('/customer');

  // If trying to access protected routes without token
  if (!token && (isSellerPath || isVetPath || isAdminPath || isCustomerPath)) {
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(url);
  }

  if (token) {
    const role = token.role;

    // Role-based path enforcement
    if (isSellerPath && role !== 'SELLER') {
      return redirectUserByRole(role, req.url);
    }

    if (isVetPath && role !== 'VET') {
      return redirectUserByRole(role, req.url);
    }

    if (isAdminPath && role !== 'ADMIN') {
      return redirectUserByRole(role, req.url);
    }

    if (isCustomerPath && role !== 'CUSTOMER') {
      return redirectUserByRole(role, req.url);
    }

    // Redirect logged in user away from /login or /register
    if (pathname === '/login' || pathname === '/register') {
      return redirectUserByRole(role, req.url);
    }
  }

  return withSecurityHeaders(NextResponse.next(), isProduction);
}

function withSecurityHeaders(response: NextResponse, isProduction: boolean) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' https://images.unsplash.com https://picsum.photos data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https:; frame-ancestors 'none'; upgrade-insecure-requests");
  }
  return response;
}

function redirectUserByRole(role: string, baseUrl: string) {
  switch (role) {
    case 'SELLER':
      return NextResponse.redirect(new URL('/seller/dashboard', baseUrl));
    case 'VET':
      return NextResponse.redirect(new URL('/vet/dashboard', baseUrl));
    case 'ADMIN':
      return NextResponse.redirect(new URL('/admin/dashboard', baseUrl));
    case 'CUSTOMER':
    default:
      return NextResponse.redirect(new URL('/customer/dashboard', baseUrl));
  }
}

export const config = {
  matcher: [
    '/seller/:path*',
    '/vet/:path*',
    '/admin/:path*',
    '/customer/:path*',
    '/checkout',
    '/api/orders/:path*',
    '/login',
    '/register',
  ],
};
