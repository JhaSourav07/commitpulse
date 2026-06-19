import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { notifyPostSchema, notifyGetSchema } from '@/lib/validations';
import { getClientIp } from '@/utils/getClientIp';
import { DistributedCache } from '@/lib/cache';
import { gitHubUserValidator } from '@/services/github/validate-user';
import { getRateLimitHeaders, notifyRateLimiter } from '@/lib/rate-limit';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';
import {
  createNotificationManagementToken,
  getNotificationManagementToken,
  hashNotificationManagementToken,
  verifyNotificationManagementToken,
} from '@/lib/notification-management-token';
import type { INotification } from '@/models/Notification';
import logger from '@/lib/logger';

const notifyWriteCache = new DistributedCache<number>(5000, 60000);
const NOTIFY_WRITE_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Masks an email address to prevent PII exposure in unauthenticated responses.
 * Example: "john.doe@gmail.com" → "jo***@gm***.com"
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***.***';

  const maskedLocal = local.slice(0, Math.min(2, local.length)) + '***';

  const dotIndex = domain.lastIndexOf('.');
  if (dotIndex === -1) {
    // Domain without a TLD (e.g., "localhost") — mask without trailing dot
    const maskedDomain = domain.slice(0, Math.min(2, domain.length)) + '***';
    return `${maskedLocal}@${maskedDomain}`;
  }

  const domainName = domain.slice(0, dotIndex);
  const tld = domain.slice(dotIndex + 1);

  const maskedDomain = domainName.slice(0, Math.min(2, domainName.length)) + '***';

  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

function isMongooseQuery<T>(value: unknown): value is { select: (fields: string) => Promise<T> } {
  return Boolean(value && typeof value === 'object' && 'select' in value);
}

async function findNotificationWithManagementHash(username: string): Promise<INotification | null> {
  const query = Notification.findOne({ username }) as unknown;
  if (isMongooseQuery<INotification | null>(query)) {
    return query.select('+managementTokenHash');
  }
  return query as Promise<INotification | null>;
}

async function authorizeNotificationMutation(
  req: Request,
  username: string,
  existing: INotification | null,
  providedToken: string | null
): Promise<{ authorized: true; via: 'token' | 'github' } | NextResponse> {
  if (existing && verifyNotificationManagementToken(providedToken, existing.managementTokenHash)) {
    return { authorized: true, via: 'token' };
  }

  const ownership = await verifyGitHubOwner(req, username);
  if (ownership.verified) {
    return { authorized: true, via: 'github' };
  }

  if (providedToken) {
    return NextResponse.json(
      { success: false, message: 'Invalid notification management token.' },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: existing
        ? 'A valid management token or matching GitHub authentication is required.'
        : ownership.message,
    },
    { status: ownership.status }
  );
}

// ─── POST /api/notify ────────────────────────────────────────────────────────
// Register or update email notification preferences for a user
export async function POST(req: Request) {
  // Rate limiting
  const ip = getClientIp(req);

  // fallback ensures rate limit is ALWAYS applied
  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${req.headers.get('user-agent') ?? 'no-agent'}`;
  const rateLimitResult = await notifyRateLimiter.checkWithResult(rateLimitKey);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // Parse JSON body safely
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Malformed JSON request body.' },
      { status: 400 }
    );
  }

  // Validate with Zod
  const parsed = notifyPostSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten();
    const firstError =
      Object.values(fieldErrors.fieldErrors).flat()[0] ??
      fieldErrors.formErrors[0] ??
      'Invalid request body.';
    return NextResponse.json({ success: false, message: firstError }, { status: 400 });
  }

  const { username, email, frequency, preferences } = parsed.data;
  const normalizedUsername = username.toLowerCase().trim();
  const providedManagementToken = getNotificationManagementToken(req, parsed.data);

  try {
    // Graceful MONGODB_URI handling
    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('Notification registration disabled: MONGODB_URI is not set', {
          environment: process.env.NODE_ENV,
        });
        return NextResponse.json(
          { success: false, message: 'Database configuration error.' },
          { status: 500 }
        );
      }

      logger.warn('Notification registration bypassed: MONGODB_URI is not set', {
        environment: process.env.NODE_ENV,
      });
      return NextResponse.json({
        success: true,
        message: 'Notification registration bypassed (no database configured).',
      });
    }

    await dbConnect();

    const existingNotification = await findNotificationWithManagementHash(normalizedUsername);
    const authorization = await authorizeNotificationMutation(
      req,
      normalizedUsername,
      existingNotification,
      providedManagementToken
    );
    if (authorization instanceof NextResponse) {
      return authorization;
    }

    // Per-username write cooldown prevents rapid upserts against the same user
    const lastWrite = await notifyWriteCache.get(`notify:write:${normalizedUsername}`);
    if (lastWrite) {
      const remaining = Math.max(
        1,
        Math.ceil((NOTIFY_WRITE_COOLDOWN_MS - (Date.now() - lastWrite)) / 1000)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before updating notification preferences again.`,
        },
        { status: 429 }
      );
    }

    // Verify the GitHub username exists before accepting notification preferences
    if (!(await gitHubUserValidator.validateUser(normalizedUsername))) {
      return NextResponse.json(
        { success: false, message: 'GitHub user not found.' },
        { status: 404 }
      );
    }

    const shouldIssueManagementToken =
      !existingNotification ||
      !existingNotification.managementTokenHash ||
      authorization.via === 'github';
    const managementToken = shouldIssueManagementToken
      ? createNotificationManagementToken()
      : undefined;

    // Upsert notification preferences
    const notification = await Notification.findOneAndUpdate(
      { username: normalizedUsername },
      {
        email: email.toLowerCase(),
        ...(managementToken
          ? { managementTokenHash: hashNotificationManagementToken(managementToken) }
          : {}),
        frequency,
        notifyOnCommit: preferences.notifyOnCommit,
        notifyOnStreak: preferences.notifyOnStreak,
        notifyOnMilestone: preferences.notifyOnMilestone,
        isActive: true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await notifyWriteCache.set(
      `notify:write:${normalizedUsername}`,
      Date.now(),
      NOTIFY_WRITE_COOLDOWN_MS
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Notification preferences saved successfully.',
        data: {
          username: notification.username,
          email: maskEmail(notification.email),
          frequency: notification.frequency,
          preferences: {
            notifyOnCommit: notification.notifyOnCommit,
            notifyOnStreak: notification.notifyOnStreak,
            notifyOnMilestone: notification.notifyOnMilestone,
          },
        },
        ...(managementToken ? { managementToken } : {}),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to save notification preferences', {
      route: '/api/notify',
      error,
    });
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/notify ──────────────────────────────────────────────────────
// Remove notification preferences for a user (unsubscribe / right to erasure)
export async function DELETE(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req);

  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${req.headers.get('user-agent') ?? 'no-agent'}`;

  if (!(await notifyRateLimiter.check(rateLimitKey))) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

  // Validate query params with Zod (reuse notifyGetSchema — expects ?user=)
  const { searchParams } = new URL(req.url);
  const parsed = notifyGetSchema.safeParse({
    user: searchParams.get('user') ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten();
    const firstError =
      Object.values(fieldErrors.fieldErrors).flat()[0] ??
      fieldErrors.formErrors[0] ??
      'Invalid request parameters.';
    return NextResponse.json({ success: false, message: firstError }, { status: 400 });
  }

  const { user: username } = parsed.data;
  const normalizedUsername = username.toLowerCase();

  try {
    // Graceful MONGODB_URI handling
    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'CRITICAL: MONGODB_URI is not set in production environment. Notification deletion is disabled.'
        );
        return NextResponse.json(
          { success: false, message: 'Database configuration error.' },
          { status: 500 }
        );
      }

      console.warn(
        'MONGODB_URI is not set. Bypassing notification deletion for local development.'
      );
      return NextResponse.json({
        success: true,
        message: 'Notification deletion bypassed (no database configured).',
      });
    }

    await dbConnect();

    const existingNotification = await findNotificationWithManagementHash(normalizedUsername);

    if (!existingNotification) {
      return NextResponse.json(
        { success: false, message: 'No notification preferences found for this user.' },
        { status: 404 }
      );
    }

    const providedManagementToken = getNotificationManagementToken(req, undefined, searchParams);
    const authorization = await authorizeNotificationMutation(
      req,
      normalizedUsername,
      existingNotification,
      providedManagementToken
    );
    if (authorization instanceof NextResponse) {
      return authorization;
    }

    const result = await Notification.deleteOne({ username: normalizedUsername });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No notification preferences found for this user.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Notification preferences deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[/api/notify] Error deleting notification preferences:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ─── GET /api/notify ─────────────────────────────────────────────────────────
// Fetch notification preferences for a user
export async function GET(req: Request) {
  // Rate limiting — always applied with user-agent fallback for unknown IPs,
  // consistent with the POST and DELETE handlers in this file.
  const ip = getClientIp(req);

  const rateLimitKey =
    ip && ip !== 'unknown' ? ip : `unknown:${req.headers.get('user-agent') ?? 'no-agent'}`;
  const rateLimitResult = await notifyRateLimiter.checkWithResult(rateLimitKey);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // Validate query params with Zod
  const { searchParams } = new URL(req.url);
  const parsed = notifyGetSchema.safeParse({
    user: searchParams.get('user') ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten();
    const firstError =
      Object.values(fieldErrors.fieldErrors).flat()[0] ??
      fieldErrors.formErrors[0] ??
      'Invalid request parameters.';
    return NextResponse.json({ success: false, message: firstError }, { status: 400 });
  }

  const { user: username } = parsed.data;

  try {
    // Graceful MONGODB_URI handling
    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'production') {
        logger.error('Notification lookup disabled: MONGODB_URI is not set', {
          environment: process.env.NODE_ENV,
        });
        return NextResponse.json(
          { success: false, message: 'Database configuration error.' },
          { status: 500 }
        );
      }
      logger.warn('Notification lookup bypassed: MONGODB_URI is not set', {
        environment: process.env.NODE_ENV,
      });

      return NextResponse.json({
        success: false,
        message: 'No notification preferences found (no database configured).',
      });
    }

    await dbConnect();

    const notification = await Notification.findOne({
      username: username.toLowerCase(),
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: 'No notification preferences found.' },
        { status: 404 }
      );
    }

    // Mask the email to prevent PII exposure in unauthenticated GET responses.
    // The full email is only accepted on POST (write) — never returned on GET (read).
    return NextResponse.json(
      {
        success: true,
        message: 'Notification preferences fetched successfully.',
        data: {
          username: notification.username,
          email: maskEmail(notification.email),
          frequency: notification.frequency,
          preferences: {
            notifyOnCommit: notification.notifyOnCommit,
            notifyOnStreak: notification.notifyOnStreak,
            notifyOnMilestone: notification.notifyOnMilestone,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Failed to fetch notification preferences', {
      route: '/api/notify',
      error,
    });
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
