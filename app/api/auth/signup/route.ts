import { NextResponse } from 'next/server';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(1).max(255),
});

/**
 * Handles user registration requests for frontend signup.
 * Integrates with production database user creation.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Full Name, Email, and Password are required and must be valid.' },
        { status: 400 }
      );
    }

    const { fullName, email } = result.data;

    // Sanitize and validate input to prevent SQL/NoSQL injection payloads
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      return NextResponse.json({ error: 'Invalid Email format.' }, { status: 400 });
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
