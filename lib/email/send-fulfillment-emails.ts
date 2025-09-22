import { mailgunService } from './mailgun';
import { render } from '@react-email/render';
import TicketTransferEmail from './templates/ticket-transfer';
import ShippingEmail from './templates/shipping';

interface SendTicketTransferEmailParams {
  userEmail: string;
  userName: string;
  orderNumber: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  city: string;
  state: string;
  tickets: Array<{
    section: string;
    row: string;
    seat: string;
  }>;
}

export async function sendTicketTransferEmail(params: SendTicketTransferEmailParams): Promise<boolean> {
  try {
    const emailHtml = await render(TicketTransferEmail({
      userName: params.userName,
      orderNumber: params.orderNumber,
      eventName: params.eventName,
      eventDate: params.eventDate,
      venue: params.venue,
      city: params.city,
      state: params.state,
      tickets: params.tickets,
      transferMethod: 'email',
      instructions: 'Your tickets have been transferred to your email. Check your inbox for the ticket provider transfer notification and accept the tickets.',
    }) as any) as string;

    const result = await mailgunService.sendTemplatedEmail(
      params.userEmail,
      `Tickets Ready - ${params.eventName}`,
      emailHtml,
      undefined,
      { tags: ['ticket-transfer', 'fulfillment'] }
    );

    if (result.success) {
    }

    return result.success;
  } catch (error) {
    console.error('Failed to send ticket transfer email:', error);
    return false;
  }
}

interface SendShippingEmailParams {
  userEmail: string;
  userName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  shippingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
  }>;
}

export async function sendShippingEmail(params: SendShippingEmailParams): Promise<boolean> {
  try {
    // Estimate delivery based on carrier (rough estimates)
    const estimatedDays = params.carrier.toUpperCase() === 'USPS' ? 5 : 3;
    const estimatedDelivery = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);

    const emailHtml = await render(ShippingEmail({
      userName: params.userName,
      orderNumber: params.orderNumber,
      trackingNumber: params.trackingNumber,
      carrier: params.carrier,
      estimatedDelivery,
      shippingAddress: params.shippingAddress,
      items: params.items,
    }) as any) as string;

    const result = await mailgunService.sendTemplatedEmail(
      params.userEmail,
      `Your SeatJumper Order Has Shipped - #${params.orderNumber}`,
      emailHtml,
      undefined,
      { tags: ['shipping', 'fulfillment'] }
    );

    if (result.success) {
    }

    return result.success;
  } catch (error) {
    console.error('Failed to send shipping email:', error);
    return false;
  }
}