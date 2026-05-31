import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { Company } from '@/models/Company';
import { comparePassword, generateToken } from '@/lib/auth';
import { signinCompanySchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signinCompanySchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues?.[0]?.message ?? parsed.error.message ?? 'Invalid input';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { email, password } = parsed.data;

    await dbConnect();

    const company = await Company.findOne({ email });
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!company.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email first via OTP' },
        { status: 403 }
      );
    }

    if (company.status === 'pending') {
      return NextResponse.json(
        { success: false, error: 'Your account is pending admin approval. Please wait.' },
        { status: 403 }
      );
    }

    if (company.status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your registration was not approved. Contact support for details.',
        },
        { status: 403 }
      );
    }

    const validPassword = await comparePassword(password, company.password);
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken({
      companyId: company._id.toString(),
      email: company.email,
      role: 'company',
    });

    return NextResponse.json({
      success: true,
      token,
      company: {
        id: company._id,
        companyName: company.companyName,
        email: company.email,
        status: company.status,
      },
    });
  } catch (error) {
    console.error('Company signin error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
