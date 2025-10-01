import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { mailgunService } from '@/lib/email/mailgun';
import { render } from '@react-email/render';
import MarketingEmail from '@/lib/email/templates/marketing';

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!adminUser?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { subject, content, ctaText, ctaUrl, previewText, testMode } = await req.json();

    // Validate required fields
    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    // If CTA text is provided, URL is required
    if (ctaText && !ctaUrl) {
      return NextResponse.json(
        { error: 'CTA URL is required when CTA text is provided' },
        { status: 400 }
      );
    }

    let recipients: any[] = [];

    if (testMode) {
      // Test mode: only send to admin
      recipients = [{
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name || 'Admin'
      }];
    } else {
      // Production mode: send to all users with marketing opt-in
      recipients = await prisma.user.findMany({
        where: {
          profile: {
            marketingEmails: true
          }
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No eligible recipients found' },
        { status: 400 }
      );
    }

    // Create campaign record
    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        content,
        previewText,
        ctaText,
        ctaUrl,
        recipientCount: recipients.length,
        status: 'SENDING',
        sentBy: adminUser.email,
      }
    });

    // Send emails
    let sentCount = 0;
    let failedCount = 0;
    const batchSize = 10; // Send in batches to avoid rate limits

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const sendPromises = batch.map(async (recipient) => {
        try {
          const unsubscribeUrl = `${process.env.NEXTAUTH_URL || 'https://seatjumper.com'}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;

          const emailHtml = await render(MarketingEmail({
            userName: recipient.name || recipient.email.split('@')[0],
            subject,
            content,
            ctaText,
            ctaUrl,
            previewText,
            unsubscribeUrl
          }) as any) as string;

          const result = await mailgunService.sendTemplatedEmail(
            recipient.email,
            subject,
            emailHtml,
            undefined,
            {
              tags: ['marketing', 'campaign', testMode ? 'test' : 'production'],
              variables: {
                campaignId: campaign.id
              }
            }
          );

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            console.error(`Failed to send to ${recipient.email}:`, result.error);
          }
        } catch (error) {
          failedCount++;
          console.error(`Error sending to ${recipient.email}:`, error);
        }
      });

      await Promise.all(sendPromises);

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        sentCount,
        status: failedCount === 0 ? 'SENT' : failedCount === recipients.length ? 'FAILED' : 'PARTIAL',
        sentAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      testMode
    });

  } catch (error) {
    console.error('Error sending marketing email:', error);
    return NextResponse.json(
      { error: 'Failed to send marketing email' },
      { status: 500 }
    );
  }
}