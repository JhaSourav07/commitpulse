import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { verifyOtpSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message ?? parsed.error.message ?? 'Invalid input';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { email, otp } = parsed.data;

    await dbConnect();

    const company = await Company.findOne({ email });
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    if (company.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified' },
        { status: 400 }
      );
    }

    if (!company.otp || !company.otpExpires) {
      return NextResponse.json(
        { success: false, error: 'No OTP was sent. Please register again.' },
        { status: 400 }
      );
    }

    if (new Date() > company.otpExpires) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    if (company.otp !== otp) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      );
    }

    company.emailVerified = true;
    company.status = 'pending';
    company.otp = null;
    company.otpExpires = null;
    await company.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Your registration is now pending admin approval.',
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
