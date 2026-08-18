import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { setAlertConfig, isValidWebhookUrl } from '@/services/github/webhook-handler';
import { cicdAlertSchema } from '@/lib/validations';

export const runtime = 'nodejs';

interface AlertConfigRequest {
  repository: string;
  enabled: boolean;
  onFailure: boolean;
  onSuccess: boolean;
  webhookUrl?: string;
  email?: string;
}

function verifyAuthToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return false;

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const expectedToken = process.env.CICD_ALERTS_SECRET || '';

  if (!expectedToken) {
    logger.warn('CICD alerts auth rejected: CICD_ALERTS_SECRET is not configured', {
      route: '/api/cicd/alerts',
    });
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAuthToken(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 1. Validate payload and webhook URL against SSRF checks via Zod
    const validationResult = cicdAlertSchema.safeParse(body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Invalid request body';
      return NextResponse.json(
        {
          error: firstError,
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { repository, webhookUrl, enabled, onFailure, onSuccess, email } = validationResult.data;

    // 2. Await async state update
    await setAlertConfig(repository, {
      enabled,
      onFailure,
      onSuccess,
      webhookUrl,
      email,
    });

    return NextResponse.json({
      success: true,
      message: `Alert configuration saved for ${body.repository}`,
      config: {
        repository: body.repository,
        enabled: body.enabled ?? true,
        onFailure: body.onFailure ?? true,
        onSuccess: body.onSuccess ?? false,
      },
    });
  } catch (error) {
    console.error('Alert configuration error:', error);
    return NextResponse.json({ error: 'Failed to update alert configuration' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Alert configuration endpoint',
    usage: {
      method: 'POST',
      body: {
        repository: 'owner/repo',
        enabled: true,
        onFailure: true,
        onSuccess: false,
        webhookUrl: 'optional-webhook-url',
        email: 'optional-email@example.com',
      },
    },
  });
}
