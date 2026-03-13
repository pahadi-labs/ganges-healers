import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

/** Paths protected by rate limiting */
const RATE_LIMITED_PREFIXES = [
  '/api/auth/',
  '/api/bookings',
  '/api/community/',
  '/api/search',
]

function shouldRateLimit(pathname: string): boolean {
  return RATE_LIMITED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!shouldRateLimit(pathname)) {
    return NextResponse.next()
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  const result = checkRateLimit(ip)

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.retryAfterMs ?? 60000) / 1000)),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', '100')
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  return response
}

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/bookings/:path*',
    '/api/community/:path*',
    '/api/search',
  ],
}
