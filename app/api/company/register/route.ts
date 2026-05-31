import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { hashPassword, generateOtp } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';
import { registerCompanySchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerCompanySchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message ?? parsed.error.message ?? 'Invalid input';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { companyName, email, password } = parsed.data;

    await dbConnect();

    const existing = await Company.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A company with this email is already registered' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const otp = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await Company.create({
      companyName,
      email,
      password: hashedPassword,
      otp,
      otpExpires,
      status: 'emailUnverified',
    });

    const emailSent = await sendOtpEmail(email, otp);

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email for the OTP.',
      emailSent,
    });
  } catch (error) {
    console.error('Company registration error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
