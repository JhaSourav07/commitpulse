import { NextResponse } from 'next/server';
import { validateGitHubUsername } from '@/lib/validations';
import { streamManager } from '@/lib/realtime/streamManager';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

  const connectionId = crypto.randomUUID();

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Keep alive heartbeat ping
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
        } catch {
          // Stream might be closed
          clearInterval(heartbeatTimer);
        }
      }, 15000);

      streamManager.register(connectionId, user, interval, (event, data) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        } catch {
          // Stream closed/aborted
          clearInterval(heartbeatTimer);
          streamManager.unregister(connectionId);
        }
      });
    },
    cancel() {
      streamManager.unregister(connectionId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
