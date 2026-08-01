import { NextResponse } from 'next/server';
import { validateGitHubUsername } from '@/lib/validations';
import { streamManager } from '@/lib/realtime/streamManager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Check if WebSocket upgrade is requested
  const upgradeHeader = request.headers.get('upgrade');
  if (upgradeHeader !== 'websocket') {
    // Fallback to Server-Sent Events (SSE) by redirecting or handling it
    // Under Next.js App Router, we can redirect or forward to the SSE handler route.
    const url = new URL(request.url);
    url.pathname = '/api/streak/live';
    return NextResponse.redirect(url);
  }

  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const intervalParam = searchParams.get('interval');

  if (!user || !validateGitHubUsername(user)) {
    return new NextResponse('Invalid or missing user parameter', { status: 400 });
  }

  let interval = 30; // default 30s
  if (intervalParam) {
    const parsed = parseInt(intervalParam, 10);
    if (!isNaN(parsed)) {
      interval = Math.max(30, Math.min(parsed, 300));
    }
  }

  try {
    // Upgrade the connection using Next.js 16/standard Node upgrade
    // @ts-expect-error - socket is available on standard request/response objects in modern Next.js/Node environments
    const { socket, response } = NextResponse.upgradeFromPending(request);

    if (!socket) {
      // Fallback if Next.js does not support/enable ws upgrades directly in this runtime environment
      const url = new URL(request.url);
      url.pathname = '/api/streak/live';
      return NextResponse.redirect(url);
    }

    const connectionId = crypto.randomUUID();

    // Standard WebSocket framing/handshake is handled by upgradeFromPending.
    // Register event listener or direct handle:
    socket.on('close', () => {
      streamManager.unregister(connectionId);
    });

    socket.on('error', () => {
      streamManager.unregister(connectionId);
    });

    streamManager.register(connectionId, user, interval, (event, data) => {
      try {
        socket.send(JSON.stringify({ event, data }));
      } catch {
        streamManager.unregister(connectionId);
        socket.close();
      }
    });

    return response;
  } catch (_err) {
    // Upgrade failed or upgradeFromPending is not supported in the current server setup
    // Fallback to SSE
    const url = new URL(request.url);
    url.pathname = '/api/streak/live';
    return NextResponse.redirect(url);
  }
}
