import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { NotificationPayload, NotificationResponse } from '@/types/index';

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
  try {
    const body: NotificationPayload = await req.json();
    const { username, email, frequency, preferences } = body;

    // Validate required fields
    if (!username || !email) {
      return NextResponse.json(
        { success: false, message: 'Username and email are required.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address.' },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies = ['realtime', 'daily', 'weekly'];
    if (frequency && !validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { success: false, message: 'Invalid frequency. Use realtime, daily, or weekly.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Upsert notification preferences
    const notification = await Notification.findOneAndUpdate(
      { username: username.toLowerCase() },
      {
        email: email.toLowerCase(),
        frequency: frequency ?? 'daily',
        notifyOnCommit: preferences?.notifyOnCommit ?? true,
        notifyOnStreak: preferences?.notifyOnStreak ?? true,
        notifyOnMilestone: preferences?.notifyOnMilestone ?? true,
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
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('user');

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Username is required.' },
        { status: 400 }
      );
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
