import { NextRequest, NextResponse } from 'next/server'

/**
 * Enhanced middleware for GNUS DAO with Cloudflare Pages compatibility
 * Handles routing, security, and performance optimizations
 */

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const response = NextResponse.next()

  // Skip middleware for static assets and API routes in static export
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/icon-') ||
    pathname.startsWith('/apple-touch-icon')
  ) {
    return response
  }

  // Security headers for all pages
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-DNS-Prefetch-Control', 'on')

  // Handle legacy routes with redirects
  const legacyRoutes: Record<string, string> = {
    '/governance': '/proposals',
    '/vote': '/proposals',
    '/voting': '/proposals',
    '/dao': '/proposals',
    '/dao/governance': '/proposals',
  }

  if (legacyRoutes[pathname]) {
    const redirectUrl = new URL(legacyRoutes[pathname], request.url)
    redirectUrl.search = search
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Handle proposal detail routes
  const proposalMatch = pathname.match(/^\/proposal\/(.+)$/)
  if (proposalMatch) {
    const redirectUrl = new URL(`/proposals/${proposalMatch[1]}`, request.url)
    redirectUrl.search = search
    return NextResponse.redirect(redirectUrl, 301)
  }

  // Add performance headers for HTML pages
  if (!pathname.includes('.')) {
    response.headers.set('Cache-Control', 'public, max-age=300, must-revalidate')
  }

  // Add CORS headers for API-like routes
  if (pathname.startsWith('/ipfs/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
