import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ orgname: string }> }) {
  // Next.js 15 requires us to "await" the dynamic URL parameters
  const resolvedParams = await params;

  return NextResponse.json({
    organization: resolvedParams.orgname,
    status: 'success',
    message: 'PR lifecycle API is alive. Data fetching to be implemented.',
    data: [],
  });
}
