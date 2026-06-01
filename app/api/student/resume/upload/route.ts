import { NextResponse } from 'next/server';
import { parseResume, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/resume-parser';
import { RateLimiter } from '@/lib/rate-limit';

const uploadLimiter = new RateLimiter(10, 60000);

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

  if (!(await uploadLimiter.check(ip))) {
    return NextResponse.json(
      { success: false, error: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

  let formData: FormData;

  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('resume') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No resume file provided' }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid file type. Only PDF and DOCX files are accepted.',
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        success: false,
        error: 'File size exceeds the 5MB limit.',
      },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseResume(buffer, file.type);

    return NextResponse.json({
      success: true,
      data: parsed,
      fileName: file.name,
    });
  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse resume. Please enter your details manually.' },
      { status: 422 }
    );
  }
}
