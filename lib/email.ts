import nodemailer from 'nodemailer';

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('SMTP not configured. OTP would be sent to', email, ':', otp);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verify your company email - CommitPulse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Use the OTP below to verify your company email address. It expires in 10 minutes.</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f5f5f5; border-radius: 8px; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

export async function sendRejectionEmail(email: string, companyName: string): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn('SMTP not configured. Rejection email would be sent to', email);
    return false;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your company registration was not approved - CommitPulse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Registration Update</h2>
          <p>Dear ${companyName},</p>
          <p>After reviewing your application, we regret to inform you that your company registration has not been approved at this time.</p>
          <p>If you believe this is a mistake or would like more information, please contact our support team at <a href="mailto:support@commitpulse.vercel.app">support@commitpulse.vercel.app</a>.</p>
          <p style="color: #666; font-size: 14px;">Thank you for your understanding.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error('Failed to send rejection email:', error);
    return false;
  }
}
