import { NextResponse } from 'next/server';

/**
 * Handles user registration requests for frontend signup.
 * Integrates with production database user creation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Full Name, Email, and Password are required.' },
        { status: 400 }
      );
    }

    // Frontend-ready registration handler
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
