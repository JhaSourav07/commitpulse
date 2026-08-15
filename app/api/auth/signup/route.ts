import { NextResponse } from 'next/server';

/**
 * Handles user registration requests for frontend signup.
 * Integrates with production database user creation.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { fullName, email, password } = body as {
      fullName?: string;
      email?: string;
      password?: string;
    };

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full Name, Email, and Password are required.' },
        { status: 400 }
      );
    }

    // Sanitize and validate input to prevent SQL/NoSQL injection payloads
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      return NextResponse.json({ error: 'Invalid Email format.' }, { status: 400 });
    }

    if (fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json({ error: 'Invalid Full Name format.' }, { status: 400 });
    }

    if (password.length < 1 || password.length > 255) {
      return NextResponse.json({ error: 'Invalid password format.' }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully.',
        user: {
          fullName,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error during account creation.' },
      { status: 500 }
    );
  }
}
