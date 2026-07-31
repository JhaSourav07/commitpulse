import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { githubUsernameSchema } from '@/lib/validations';
import { validateCSRF } from '@/lib/security/csrf';

const MAX_GOAL = 10_000_000;

function getUsername(req: Request) {
  const username = new URL(req.url).searchParams.get('username');
  const parsed = githubUsernameSchema.safeParse(username?.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

function parseGoals(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { monthly?: unknown; yearly?: unknown };
  if (
    typeof candidate.monthly !== 'number' ||
    typeof candidate.yearly !== 'number' ||
    !Number.isInteger(candidate.monthly) ||
    !Number.isInteger(candidate.yearly) ||
    candidate.monthly < 1 ||
    candidate.yearly < 1 ||
    candidate.monthly > MAX_GOAL ||
    candidate.yearly > MAX_GOAL
  ) {
    return null;
  }
  return { monthly: candidate.monthly, yearly: candidate.yearly };
}

export async function GET(req: Request) {
  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: 'Invalid GitHub username' }, { status: 400 });

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ goals: null });
  }

  try {
    await dbConnect();
    const user = await User.findOne({ username }).select('contributionGoals').lean();
    const goals = user?.contributionGoals ? parseGoals(user.contributionGoals) : null;
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('[/api/user/goals GET] Error:', error);
    return NextResponse.json({ error: 'Unable to load goals' }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const csrfError = validateCSRF(req);
  if (csrfError) return csrfError;

  const username = getUsername(req);
  if (!username) return NextResponse.json({ error: 'Invalid GitHub username' }, { status: 400 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Malformed JSON request body' }, { status: 400 });
  }

  const goals = parseGoals(body);
  if (!goals) return NextResponse.json({ error: 'Invalid goals' }, { status: 400 });
  if (!process.env.MONGODB_URI) return NextResponse.json({ goals, bypassed: true });

  try {
    await dbConnect();
    await User.updateOne(
      { username },
      {
        $setOnInsert: { username },
        $set: { contributionGoals: goals },
      },
      { upsert: true }
    );
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('[/api/user/goals PUT] Error:', error);
    return NextResponse.json({ error: 'Unable to save goals' }, { status: 503 });
  }
}
