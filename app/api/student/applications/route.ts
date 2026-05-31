import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Application } from '@/models/Application';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username || typeof username !== 'string' || !username.trim()) {
    return NextResponse.json({ error: 'Missing or invalid username parameter' }, { status: 400 });
  }

  try {
    await dbConnect();

    const applications = await Application.find({
      studentUsername: username.trim().toLowerCase(),
    })
      .populate('jobId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
