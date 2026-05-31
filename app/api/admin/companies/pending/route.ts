import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Company } from '@/models/Company';

export async function GET() {
  try {
    await dbConnect();

    const companies = await Company.find({ status: 'pending' })
      .select('-password -otp -otpExpires')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, companies });
  } catch (error) {
    console.error('Get pending companies error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
