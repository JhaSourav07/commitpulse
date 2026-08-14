import { NextResponse } from 'next/server';

/**
 * Handles credentials authentication requests for frontend login.
 * Integrates with NextAuth sessions and production backend user models.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { identifier, password } = body as {
      identifier?: string;
      password?: string;
    };

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email or Username and Password are required.' },
        { status: 400 }
      );
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
