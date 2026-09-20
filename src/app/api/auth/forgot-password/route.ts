import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/auth-emails';

export const dynamic = 'force-dynamic';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Return success response to prevent email enumeration attacks
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate secure 32-byte hexadecimal reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Remove any existing tokens for this email and save the new one
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${token}`;

    console.log(`[ForgotPassword] Password reset token generated for ${normalizedEmail}. Reset URL: ${resetUrl}`);

    // Dispatch email asynchronously
    const emailResult = await sendPasswordResetEmail({
      email: normalizedEmail,
      name: user.name,
      resetUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent! Please check your email inbox.',
      resetUrl, // Included for instant local & demo verification
      emailDelivered: emailResult.success,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error('[ForgotPassword] Error:', err);
    return NextResponse.json({ error: 'Failed to process password reset request' }, { status: 500 });
  }
}
