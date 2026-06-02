import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { NotificationResponse } from '@/types/index';
import { notifyPostSchema, notifyGetSchema } from '@/lib/validations';
import { notifyRateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';

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

// ─── POST /api/notify ────────────────────────────────────────────────────────
// Register or update email notification preferences for a user
export async function POST(req: NextRequest): Promise<NextResponse<NotificationResponse>> {
  // Rate limiting
  const ip = getClientIp(req);

  if (ip !== 'unknown' && !(await notifyRateLimiter.check(ip))) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      { status: 429 }
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

  try {
    // Graceful MONGODB_URI handling
    if (!process.env.MONGODB_URI) {
      if (process.env.NODE_ENV === 'production') {
        console.error(
          'CRITICAL: MONGODB_URI is not set in production environment. Notification registration is disabled.'
        );
        return NextResponse.json(
          { success: false, message: 'Database configuration error.' },
          { status: 500 }
        );
      }

      console.warn(
        'MONGODB_URI is not set. Bypassing notification registration for local development.'
      );
      return NextResponse.json({
        success: true,
        message: 'Notification registration bypassed (no database configured).',
      });
    }

    await dbConnect();

    // Upsert notification preferences
    const notification = await Notification.findOneAndUpdate(
      { username: username.toLowerCase() },
      {
        email: email.toLowerCase(),
        frequency,
        notifyOnCommit: preferences.notifyOnCommit,
        notifyOnStreak: preferences.notifyOnStreak,
        notifyOnMilestone: preferences.notifyOnMilestone,
        isActive: true,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Notification preferences saved successfully.',
        data: {
          username: notification.username,
          email: notification.email,
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
    console.error('[/api/notify] Error saving notification preferences:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ─── GET /api/notify ─────────────────────────────────────────────────────────
// Fetch notification preferences for a user
export async function GET(req: NextRequest): Promise<NextResponse<NotificationResponse>> {
  // Rate limiting
  const ip = getClientIp(req);

  if (ip !== 'unknown' && !(await notifyRateLimiter.check(ip))) {
    return NextResponse.json(
      { success: false, message: 'Too many requests, please try again later.' },
      { status: 429 }
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
        console.error(
          'CRITICAL: MONGODB_URI is not set in production environment. Notification lookup is disabled.'
        );
        return NextResponse.json(
          { success: false, message: 'Database configuration error.' },
          { status: 500 }
        );
      }

      console.warn('MONGODB_URI is not set. Bypassing notification lookup for local development.');
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
    console.error('[/api/notify] Error fetching notification preferences:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
