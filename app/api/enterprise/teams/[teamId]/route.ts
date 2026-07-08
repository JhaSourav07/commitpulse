import { NextRequest, NextResponse } from 'next/server';
import { requireEnterpriseAdmin } from '@/lib/enterprise-auth';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { error } = await requireEnterpriseAdmin();
  if (error) return error;

  const { teamId } = await params;

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: `Team ${teamId} updated`,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { error } = await requireEnterpriseAdmin();
  if (error) return error;

  const { teamId } = await params;

  if (!teamId) {
    return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: `Team ${teamId} deleted`,
  });
}
