import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import cuid from 'cuid';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { mailgunService } from '@/lib/email/mailgun';
import { render } from '@react-email/render';
import WelcomeEmail from '@/lib/email/templates/welcome';

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      phone,
      password,
      ageVerified,
      consentPrivacyPolicy,
      consentTermsOfService,
      consentMarketing
    } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate age verification
    if (!ageVerified) {
      return NextResponse.json(
        { message: 'You must be 18 or older to create an account' },
        { status: 400 }
      );
    }

    // Validate required consents
    if (!consentPrivacyPolicy || !consentTermsOfService) {
      return NextResponse.json(
        { message: 'You must agree to the Privacy Policy and Terms of Service' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate IDs
    const userId = cuid();
    const profileId = cuid();
    const now = new Date();

    // Create user
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        phone,
        password: hashedPassword,
        updatedAt: now,
        profile: {
          create: {
            id: profileId,
            notifyEmail: true,
            notifySms: false,
            marketingEmails: consentMarketing || false,
            ageVerified: true,
            ageVerifiedAt: now,
            consentPrivacyPolicy: true,
            consentPrivacyPolicyAt: now,
            consentTermsOfService: true,
            consentTermsOfServiceAt: now,
            consentMarketingAt: consentMarketing ? now : null,
            updatedAt: now,
          },
        },
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        token: verificationToken,
        userId: user.id,
        expiresAt,
      },
    });

    // Send welcome email with verification button
    try {
      const emailHtml = await render(WelcomeEmail({
        userName: name || email.split('@')[0],
        userEmail: email,
        verificationToken,
      }) as any) as string;

      await mailgunService.sendTemplatedEmail(
        email,
        'Welcome to SeatJumper!',
        emailHtml,
        undefined,
        { tags: ['welcome', 'registration'] }
      );

    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}