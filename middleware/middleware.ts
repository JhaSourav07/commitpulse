import { NextRequest, NextResponse } from 'next/server';
import { logger, setRequestId, clearRequestId } from '@/lib/logger';

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();

  // Set request ID in logger context for this request
  setRequestId(requestId);

  logger.info('Incoming API request', {
    source: 'middleware',
    path: request.url,
    method: request.method,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('X-Request-ID', requestId);

  // Clear request ID after response is sent
  clearRequestId();

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
