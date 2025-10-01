import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mailgunService } from '@/lib/email/mailgun';
import { render } from '@react-email/render';
import PasswordResetEmail from '@/lib/email/templates/password-reset';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      // console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link.',
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store token in database with 24-hour expiry
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        token: hashedToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      const emailHtml = await render(PasswordResetEmail({
        userName: user.name || email.split('@')[0],
        resetUrl,
        expiresInHours: 24,
      }) as any) as string;

      await mailgunService.sendTemplatedEmail(
        email,
        'Reset Your SeatJumper Password',
        emailHtml,
        undefined,
        { tags: ['password-reset', 'security'] }
      );

    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Delete the token if email fails
      await prisma.passwordResetToken.delete({
        where: { token: hashedToken },
      });

      return NextResponse.json(
        { message: 'Failed to send password reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}