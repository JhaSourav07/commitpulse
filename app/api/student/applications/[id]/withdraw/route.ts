import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Application } from '@/models/Application';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Missing application ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    const application = await Application.findById(id);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'applied') {
      return NextResponse.json(
        { error: 'Can only withdraw applications with status "applied"' },
        { status: 400 }
      );
    }

    application.status = 'withdrawn';
    await application.save();

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
