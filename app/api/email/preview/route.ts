import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import WelcomeEmail from '@/lib/email/templates/welcome';
import PasswordResetEmail from '@/lib/email/templates/password-reset';
import PasswordChangedEmail from '@/lib/email/templates/password-changed';
import OrderReceiptEmail from '@/lib/email/templates/order-receipt';
import TicketTransferEmail from '@/lib/email/templates/ticket-transfer';
import ShippingEmail from '@/lib/email/templates/shipping';

// This endpoint is for development/testing only
// It allows previewing email templates without sending actual emails

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const template = searchParams.get('template');

  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Email preview is only available in development' },
      { status: 403 }
    );
  }

  let emailHtml: string;

  try {
    switch (template) {
      case 'welcome':
        emailHtml = await render(WelcomeEmail({
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
        }) as any) as string;
        break;

      case 'password-reset':
        emailHtml = await render(PasswordResetEmail({
          userName: 'John Doe',
          resetUrl: 'https://seatjumper.com/auth/reset-password?token=example-token',
          expiresInHours: 24,
        }) as any) as string;
        break;

      case 'password-changed':
        emailHtml = await render(PasswordChangedEmail({
          userName: 'John Doe',
          userEmail: 'john.doe@example.com',
          changedAt: new Date(),
        }) as any) as string;
        break;

      case 'order-receipt':
        emailHtml = await render(OrderReceiptEmail({
          userName: 'John Doe',
          orderNumber: 'ORD-2024-001234',
          eventName: 'Lakers vs Warriors',
          eventDate: new Date('2024-12-25T19:30:00'),
          venue: 'Crypto.com Arena',
          city: 'Los Angeles',
          state: 'CA',
          pricePaid: 299.99,
          tickets: [
            { section: '101', row: '15', seat: '12', pricePerSeat: 450 },
            { section: '101', row: '15', seat: '13', pricePerSeat: 450 },
          ],
          memorabilia: [
            {
              name: 'LeBron James Signed Basketball Card',
              value: 250,
              description: '2023 Prizm Silver Parallel #1',
            },
            {
              name: 'Warriors Team Photo',
              value: 75,
              description: '8x10 Glossy Team Photo',
            },
          ],
          orderDate: new Date(),
        }) as any) as string;
        break;

      case 'ticket-transfer':
        emailHtml = await render(TicketTransferEmail({
          userName: 'John Doe',
          orderNumber: 'ORD-2024-001234',
          eventName: 'Lakers vs Warriors',
          eventDate: new Date('2024-12-25T19:30:00'),
          venue: 'Crypto.com Arena',
          city: 'Los Angeles',
          state: 'CA',
          tickets: [
            { section: '101', row: '15', seat: '12' },
            { section: '101', row: '15', seat: '13' },
          ],
          transferMethod: 'email',
          instructions: 'Check your email for the Ticketmaster transfer. Accept the tickets and save them to your mobile wallet.',
        }) as any) as string;
        break;

      case 'shipping':
        emailHtml = await render(ShippingEmail({
          userName: 'John Doe',
          orderNumber: 'ORD-2024-001234',
          trackingNumber: '1Z999AA10123456784',
          carrier: 'UPS',
          estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          shippingAddress: {
            street1: '123 Main Street',
            street2: 'Apt 4B',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
          },
          items: [
            {
              name: 'LeBron James Signed Basketball Card',
              description: '2023 Prizm Silver Parallel #1',
              quantity: 1,
            },
            {
              name: 'Warriors Team Photo',
              description: '8x10 Glossy Team Photo',
              quantity: 1,
            },
          ],
        }) as any) as string;
        break;

      default:
        return NextResponse.json(
          {
            error: 'Invalid template',
            availableTemplates: [
              'welcome',
              'password-reset',
              'password-changed',
              'order-receipt',
              'ticket-transfer',
              'shipping'
            ]
          },
          { status: 400 }
        );
    }

    // Return HTML response for browser preview
    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error: any) {
    console.error('Error rendering email template:', error);
    return NextResponse.json(
      { error: 'Failed to render template', details: error.message },
      { status: 500 }
    );
  }
}