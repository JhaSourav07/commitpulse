import { NextResponse } from 'next/server';
import {
  parseResume,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  hasValidFileSignature,
} from '@/lib/resume-parser';
import { RateLimiter } from '@/lib/rate-limit';
import { getClientIp } from '@/utils/getClientIp';

const uploadLimiter = new RateLimiter(10, 60000);

/**
 * Sanitizes a filename to prevent directory traversal and other attacks.
 */
function sanitizeFilename(filename: string): string {
  // Remove any path separators and dangerous characters
  const sanitized = filename
    .replace(/[\\/]/g, '_') // Replace path separators
    .replace(/\.\./g, '_') // Replace directory traversal attempts
    .replace(/[^\w.\-]/g, '_') // Replace any other non-alphanumeric characters
    .toLowerCase();

  // Ensure filename doesn't start with a dot (hidden files)
  const cleanName = sanitized.startsWith('.') ? '_' + sanitized.slice(1) : sanitized;

  // Limit filename length
  return cleanName.substring(0, 255);
}

/**
 * Validates file extension matches the MIME type.
 */
function validateFileExtension(filename: string, mimeType: string): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  const validExtensions: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  };

  const allowedExts = validExtensions[mimeType];
  if (!allowedExts) return false;

  return allowedExts.includes(ext || '');
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

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

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid file type. Only PDF and DOCX files are accepted.',
      },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        success: false,
        error: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
      },
      { status: 400 }
    );
  }

  // Validate file size is not zero or too small
  if (file.size < 10) {
    return NextResponse.json(
      { success: false, error: 'File is too small to be a valid document.' },
      { status: 400 }
    );
  }

  // Sanitize filename
  const sanitizedFileName = sanitizeFilename(file.name);

  // Validate file extension matches MIME type
  if (!validateFileExtension(sanitizedFileName, file.type)) {
    return NextResponse.json(
      {
        success: false,
        error:
          'File extension does not match the file type. Please ensure the filename ends with the correct extension.',
      },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate file signature (magic bytes)
    if (!hasValidFileSignature(buffer, file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'File content does not match its type. Only genuine PDF or DOCX files are accepted.',
        },
        { status: 400 }
      );
    }

    // Additional security: Check for encrypted/password-protected PDFs
    if (file.type === 'application/pdf') {
      const pdfContent = buffer.toString('utf-8');
      if (pdfContent.includes('/Encrypt') || pdfContent.includes('encrypt')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Encrypted or password-protected PDFs are not supported.',
          },
          { status: 400 }
        );
      }
    }

    const parsed = await parseResume(buffer, file.type);

    return NextResponse.json({
      success: true,
      data: parsed,
      fileName: sanitizedFileName,
    });
  } catch (error) {
    // Log error for monitoring (in production, use proper logging service)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error parsing resume:', errorMessage);

    // Return generic error message to user (don't expose internal details)
    return NextResponse.json(
      { success: false, error: 'Failed to parse resume. Please enter your details manually.' },
      { status: 422 }
    );
  }
}
