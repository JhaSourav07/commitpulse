import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ orgname: string }> }) {
  // Next.js 15 async params requirement
  const resolvedParams = await params;

  return NextResponse.json({
    organization: resolvedParams.orgname,
    status: 'success',
    module: 'Security Command Center',
    message: 'Security overview API is active. Data aggregation to be implemented.',
    data: {
      score: null,
      vulnerabilities: [],
    },
  });
}
