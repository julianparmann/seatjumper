import * as React from 'react';
import { Text, Section, Heading, Row, Column } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, Card, InfoRow, PriceDisplay, Divider } from './components';

interface Ticket {
  section: string;
  row: string;
  seat: string;
  pricePerSeat: number;
}

interface Memorabilia {
  name: string;
  value: number;
  description?: string;
}

interface OrderReceiptEmailProps {
  userName: string;
  orderNumber: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  city: string;
  state: string;
  pricePaid: number;
  tickets: Ticket[];
  memorabilia: Memorabilia[];
  orderDate: Date;
}

export const OrderReceiptEmail: React.FC<OrderReceiptEmailProps> = ({
  userName,
  orderNumber,
  eventName,
  eventDate,
  venue,
  city,
  state,
  pricePaid,
  tickets,
  memorabilia,
  orderDate,
}) => {
  const preview = `Your SeatJumper order #${orderNumber} is confirmed!`;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <BaseEmailTemplate preview={preview}>
      <Section style={successBanner}>
        <Text style={successText}>🎉 Congratulations {userName}!</Text>
        <Text style={successSubtext}>Your Jump Was Successful</Text>
      </Section>

      <Heading style={heading}>
        Order Confirmation
      </Heading>

      <Section style={orderInfo}>
        <InfoRow label="Order Number" value={`#${orderNumber}`} bold />
        <InfoRow label="Order Date" value={formatDate(orderDate)} />
        <InfoRow label="Amount Paid" value={`$${pricePaid.toFixed(2)}`} bold />
      </Section>

      <Divider />

      <Card title="Event Details" highlighted>
        <Text style={eventTitle}>{eventName}</Text>
        <InfoRow label="Date" value={formatDate(eventDate)} />
        <InfoRow label="Venue" value={venue} />
        <InfoRow label="Location" value={`${city}, ${state}`} />
      </Card>

      <Card title={`🎫 Tickets Won (${tickets.length})`}>
        {tickets.length > 0 ? (
          <>
            {tickets.map((ticket, index) => (
              <Section key={index} style={ticketItem}>
                <Text style={ticketText}>
                  <strong>Seat {index + 1}:</strong> Section {ticket.section}, Row {ticket.row}, Seat {ticket.seat}
                </Text>
                {ticket.pricePerSeat > 0 && (
                  <Text style={valueText}>
                    Retail Value: ${ticket.pricePerSeat.toFixed(2)}
                  </Text>
                )}
              </Section>
            ))}
            <Text style={{ ...emptyText, fontSize: '12px', fontStyle: 'italic', marginTop: '8px' }}>
              * You will receive the exact seats listed above or comparable seats if these specific seats have been taken.
            </Text>
          </>
        ) : (
          <Text style={emptyText}>No tickets in this jump</Text>
        )}
      </Card>

      <Card title={`🏆 Prizes Won (${memorabilia.length})`}>
        {memorabilia.length > 0 ? (
          memorabilia.map((item, index) => (
            <Section key={index} style={memorabiliaItem}>
              <Text style={memorabiliaName}>
                <strong>{item.name}</strong>
              </Text>
              {item.description && (
                <Text style={memorabiliaDesc}>{item.description}</Text>
              )}
              {item.value > 0 && (
                <Text style={valueText}>
                  Estimated Value: ${item.value.toFixed(2)}
                </Text>
              )}
            </Section>
          ))
        ) : (
          <Text style={emptyText}>No memorabilia in this jump</Text>
        )}
      </Card>

      <Section style={nextSteps}>
        <Heading as="h2" style={subheading}>
          What Happens Next?
        </Heading>
        <Text style={listItem}>
          <strong>1. Ticket Transfer:</strong> Your tickets will be transferred to your email within 24-48 hours before the event
        </Text>
        <Text style={listItem}>
          <strong>2. Prize Shipping:</strong> Physical items will be shipped to your address within 5-7 business days
        </Text>
        <Text style={listItem}>
          <strong>3. Email Updates:</strong> You'll receive notifications when tickets are transferred and items are shipped
        </Text>
      </Section>

      <EmailButton href={`https://seatjumper.com/orders/${orderNumber}`}>
        View Order Details
      </EmailButton>

      <Section style={{ marginTop: '32px' }}>
        <Text style={supportText}>
          <strong>Need Help?</strong>
        </Text>
        <Text style={supportText}>
          Reply to support@seatjumper.com with your order number and your issue
        </Text>
        <Text style={supportText}>
          Order Reference: #{orderNumber}
        </Text>
      </Section>

      <Text style={signoff}>
        Thank you for jumping with us!
      </Text>
      <Text style={signoff}>
        The SeatJumper Team
      </Text>
    </BaseEmailTemplate>
  );
};

// Styles
const successBanner = {
  backgroundColor: '#d4edda',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const successText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#155724',
  margin: '0 0 8px 0',
};

const successSubtext = {
  fontSize: '16px',
  color: '#155724',
  margin: 0,
};

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#333333',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const subheading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '24px 0 16px 0',
};

const orderInfo = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const eventTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333333',
  marginBottom: '16px',
  marginTop: 0,
};

const ticketItem = {
  borderBottom: '1px solid #e1e4e8',
  paddingBottom: '12px',
  marginBottom: '12px',
};

const ticketText = {
  fontSize: '14px',
  color: '#333333',
  margin: '4px 0',
};

const memorabiliaItem = {
  borderBottom: '1px solid #e1e4e8',
  paddingBottom: '12px',
  marginBottom: '12px',
};

const memorabiliaName = {
  fontSize: '15px',
  color: '#333333',
  margin: '4px 0',
};

const memorabiliaDesc = {
  fontSize: '13px',
  color: '#666666',
  margin: '4px 0',
};

const valueText = {
  fontSize: '13px',
  color: '#28a745',
  fontStyle: 'italic',
  margin: '4px 0',
};

const emptyText = {
  fontSize: '14px',
  color: '#666666',
  fontStyle: 'italic',
  margin: '8px 0',
};

const nextSteps = {
  marginTop: '32px',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#555555',
  margin: '12px 0',
  paddingLeft: '8px',
};

const supportText = {
  fontSize: '14px',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '4px 0',
};

const signoff = {
  fontSize: '16px',
  color: '#333333',
  margin: '8px 0',
  textAlign: 'center' as const,
};

export default OrderReceiptEmail;