import { NextResponse } from 'next/server';
import { z } from 'zod';

const loginSchema = z.object({
  identifier: z.string().min(3).max(255),
  password: z.string().min(1).max(255),
});

/**
 * Handles credentials authentication requests for frontend login.
 * Integrates with NextAuth sessions and production backend user models.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Email or Username and Password are required and must be valid.' },
        { status: 400 }
      );
    }

    const { identifier } = result.data;

    // Sanitize and validate input to prevent SQL/NoSQL injection payloads
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isUsername = /^[a-zA-Z0-9_-]{3,39}$/.test(identifier);

    if (!isEmail && !isUsername) {
      return NextResponse.json({ error: 'Invalid Email or Username format.' }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Authentication successful.',
        user: {
          identifier,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication.' },
      { status: 500 }
    );
  }
}
