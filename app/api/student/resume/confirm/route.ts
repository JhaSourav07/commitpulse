import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { StudentProfile } from '@/models/StudentProfile';
import { RateLimiter } from '@/lib/rate-limit';
import type { ParsedResume } from '@/types/student';
import { getClientIp } from '@/utils/getClientIp';

const confirmLimiter = new RateLimiter(10, 60000);

export async function POST(req: Request) {
  const ip = getClientIp(req);

  if (!(await confirmLimiter.check(ip))) {
    return NextResponse.json(
      { success: false, error: 'Too many requests, please try again later.' },
      { status: 429 }
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

  if (!githubUsername || typeof githubUsername !== 'string') {
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

  const profileData = data as ParsedResume;

  if (!profileData.name || !profileData.email) {
    return NextResponse.json(
      { success: false, error: 'Name and email are required' },
      { status: 400 }
    );
  }

  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is not set. Bypassing student profile save.');
      return NextResponse.json({ success: true, bypassed: true });
    }

    await dbConnect();

    await StudentProfile.findOneAndUpdate(
      { githubUsername: githubUsername.trim().toLowerCase() },
      {
        $set: {
          name: profileData.name,
          email: profileData.email,
          skills: profileData.skills || [],
          education: profileData.education || [],
          experience: profileData.experience || [],
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving student profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save profile data' },
      { status: 500 }
    );
  }
}
