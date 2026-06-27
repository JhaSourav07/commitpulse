import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { StudentProfile } from '@/models/StudentProfile';
import { getRateLimitHeaders, RateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';
import { resumeConfirmDataSchema, GITHUB_USERNAME_REGEX } from '@/lib/validations';
import { verifyGitHubOwner } from '@/lib/github-owner-verification';
import { logger } from '@/lib/logger';
import { validateCSRF } from '@/lib/security/csrf';

const confirmLimiter = new RateLimiter(10, 60000);

export async function POST(req: Request) {
  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;
  const ip = getClientIp(req);

  const rateLimitResult = await confirmLimiter.checkWithResult(ip);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests, please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed JSON request body' },
      { status: 400 }
    );
  }

  const { githubUsername, data } = body as {
    githubUsername?: unknown;
    data?: unknown;
  };

  if (
    !githubUsername ||
    typeof githubUsername !== 'string' ||
    githubUsername.trim().length > 39 ||
    !GITHUB_USERNAME_REGEX.test(githubUsername.trim())
  ) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing githubUsername' },
      { status: 400 }
    );
  }

  if (!data || typeof data !== 'object') {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing profile data' },
      { status: 400 }
    );
  }

  const { name, email } = data as { name?: unknown; email?: unknown };
  if (!name || !email) {
    return NextResponse.json(
      { success: false, error: 'Name and email are required' },
      { status: 400 }
    );
  }

  const parsed = resumeConfirmDataSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid profile data' },
      { status: 400 }
    );
  }
  const profile = parsed.data;
  const normalizedUsername = githubUsername.trim().toLowerCase();

  const ownership = await verifyGitHubOwner(req, normalizedUsername);
  if (!ownership.verified) {
    return NextResponse.json(
      { success: false, error: ownership.message },
      { status: ownership.status }
    );
  }

  try {
    if (!process.env.MONGODB_URI) {
      const isProduction =
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production' ||
        process.env.VERCEL_ENV === 'preview';
      if (isProduction) {
        return NextResponse.json(
          { success: false, error: 'Server configuration error: Database not configured' },
          { status: 500 }
        );
      }

      logger.warn('Student profile save bypassed: MONGODB_URI is not set', {
        environment: process.env.NODE_ENV,
      });

      return NextResponse.json({ success: true, bypassed: true });
    }

    await dbConnect();

    await StudentProfile.findOneAndUpdate(
      { githubUsername: normalizedUsername },
      {
        $set: {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          skills: profile.skills,
          education: profile.education,
          experience: profile.experience,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to save student profile', {
      error,
    });
    return NextResponse.json(
      { success: false, error: 'Failed to save profile data' },
      { status: 500 }
    );
  }
}
