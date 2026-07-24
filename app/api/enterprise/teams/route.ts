import { NextRequest, NextResponse } from 'next/server';

const mockTeams: Record<string, { id: string; name: string; members: string[] }> = {};

export async function GET() {
  const teams = Object.values(mockTeams);

  return NextResponse.json({
    success: true,
    data: teams,
  });
}

export async function POST(request: NextRequest) {
  let body: { name?: string; members?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body?.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
  }

  const teamId = `team-${Date.now()}`;
  mockTeams[teamId] = {
    id: teamId,
    name: body.name,
    members: Array.isArray(body.members) ? body.members : [],
  };

  return NextResponse.json(
    {
      success: true,
      data: mockTeams[teamId],
    },
    { status: 201 }
  );
}
