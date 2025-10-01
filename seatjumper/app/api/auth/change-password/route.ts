import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { mailgunService } from '@/lib/email/mailgun';
import { render } from '@react-email/render';
import PasswordChangedEmail from '@/lib/email/templates/password-changed';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, password: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a password (might be OAuth only)
    if (!user.password) {
      return NextResponse.json(
        { error: 'Cannot change password for OAuth-only accounts' },
        { status: 400 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword }
    });

    // Send password change confirmation email
    try {
      const emailHtml = await render(PasswordChangedEmail({
        userName: user.name || user.email.split('@')[0],
        userEmail: user.email,
        changedAt: new Date(),
      }) as any) as string;

      await mailgunService.sendTemplatedEmail(
        user.email,
        'Your SeatJumper Password Has Been Changed',
        emailHtml,
        undefined,
        { tags: ['password-changed', 'security'] }
      );

    } catch (emailError) {
      console.error('Failed to send password change email:', emailError);
      // Don't fail the password change if email fails
    }

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}