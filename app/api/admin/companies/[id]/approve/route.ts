import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Company } from '@/models/Company';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await dbConnect();

    const company = await Company.findById(id);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (company.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Company is not in pending status' },
        { status: 400 }
      );
    }

    company.status = 'approved';
    await company.save();

    return NextResponse.json({
      success: true,
      message: 'Company approved successfully. They can now log in and post jobs.',
    });
  } catch (error) {
    console.error('Approve company error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
