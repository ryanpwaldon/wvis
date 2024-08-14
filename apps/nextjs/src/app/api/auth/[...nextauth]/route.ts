import { NextRequest } from 'next/server'

import { handlers, isSecureContext } from '@sctv/auth'

export const runtime = 'edge'

/**
 * Noop in production.
 *
 * In development, rewrite the request URL to use localhost instead of host IP address
 * so that Expo Auth works without getting trapped by Next.js CSRF protection.
 * @param req The request to modify
 * @returns The modified request.
 */
function rewriteRequestUrlInDevelopment(req: NextRequest) {
  if (isSecureContext) return req

  const host = req.headers.get('host')
  const newURL = new URL(req.url)
  newURL.host = host ?? req.nextUrl.host
  return new NextRequest(newURL, req)
}

export const POST = async (_req: NextRequest) => {
  // First step must be to correct the request URL.
  const req = rewriteRequestUrlInDevelopment(_req)
  return handlers.POST(req)
}

export const GET = async (_req: NextRequest) => {
  // First step must be to correct the request URL.
  const req = rewriteRequestUrlInDevelopment(_req)
  return handlers.GET(req)
}
