import * as React from 'react';
import { Text, Section, Heading } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, Card, InfoRow, AlertBox } from './components';

interface Ticket {
  section: string;
  row: string;
  seat: string;
}

interface TicketTransferEmailProps {
  userName: string;
  orderNumber: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  city: string;
  state: string;
  tickets: Ticket[];
  transferMethod?: string;
  instructions?: string;
}

export const TicketTransferEmail: React.FC<TicketTransferEmailProps> = ({
  userName,
  orderNumber,
  eventName,
  eventDate,
  venue,
  city,
  state,
  tickets,
  transferMethod = 'email',
  instructions,
}) => {
  const preview = `Your tickets for ${eventName} have been transferred!`;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <BaseEmailTemplate preview={preview}>
      <Section style={successBanner}>
        <Text style={successText}>🎫 Tickets Transferred!</Text>
      </Section>

      <Heading style={heading}>
        Your Tickets Are Ready
      </Heading>

      <Text style={paragraph}>
        Hi {userName},
      </Text>

      <Text style={paragraph}>
        Great news! Your tickets for the upcoming event have been successfully transferred to you.
      </Text>

      <Card title="Event Details" highlighted>
        <Text style={eventTitle}>{eventName}</Text>
        <InfoRow label="Date & Time" value={formatDate(eventDate)} />
        <InfoRow label="Venue" value={venue} />
        <InfoRow label="Location" value={`${city}, ${state}`} />
        <InfoRow label="Order Number" value={`#${orderNumber}`} />
      </Card>

      <Card title={`Your Tickets (${tickets.length})`}>
        {tickets.map((ticket, index) => (
          <Section key={index} style={ticketItem}>
            <Text style={ticketText}>
              <strong>Ticket {index + 1}:</strong>
            </Text>
            <Text style={ticketDetails}>
              Section {ticket.section} | Row {ticket.row} | Seat {ticket.seat}
            </Text>
          </Section>
        ))}
      </Card>

      <AlertBox type="info">
        <Text>
          <strong>Transfer Method:</strong> Your tickets have been transferred via {transferMethod}.
          {transferMethod === 'email' && ' Check your email for the ticket provider transfer notification.'}
        </Text>
      </AlertBox>

      {instructions && (
        <Card title="How to Access Your Tickets">
          <Text style={instructionText}>{instructions}</Text>
        </Card>
      )}

      <Section style={importantNotes}>
        <Heading as="h2" style={subheading}>
          Important Information
        </Heading>

        <Text style={listItem}>
          <strong>📱 Mobile Tickets:</strong> Most venues accept mobile tickets. Save them to your phone's wallet for easy access.
        </Text>

        <Text style={listItem}>
          <strong>🎫 Entry Requirements:</strong> Bring a valid photo ID matching the ticket holder's name.
        </Text>

        <Text style={listItem}>
          <strong>⏰ Arrival Time:</strong> Arrive at least 30 minutes before the event starts to allow time for entry.
        </Text>

        <Text style={listItem}>
          <strong>🚗 Parking:</strong> Check the venue's website for parking information and arrive early to secure a spot.
        </Text>
      </Section>

      <EmailButton href={`https://seatjumper.com/orders/${orderNumber}`}>
        View Order Details
      </EmailButton>

      <Section style={gameDay}>
        <Text style={gameDayTitle}>
          Game Day Checklist:
        </Text>
        <Text style={checklistItem}>✓ Tickets saved to phone/wallet</Text>
        <Text style={checklistItem}>✓ Photo ID ready</Text>
        <Text style={checklistItem}>✓ Parking planned</Text>
        <Text style={checklistItem}>✓ Weather-appropriate clothing</Text>
      </Section>

      <Text style={supportText}>
        <strong>Need help?</strong> Reply to support@seatjumper.com with your order number and your issue
      </Text>

      <Text style={signoff}>
        Enjoy the game!
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  margin: '16px 0',
};

const eventTitle = {
  fontSize: '20px',
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
  color: '#666666',
  margin: '4px 0',
};

const ticketDetails = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '4px 0',
};

const instructionText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#333333',
  margin: '8px 0',
};

const importantNotes = {
  marginTop: '32px',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#555555',
  margin: '12px 0',
  paddingLeft: '8px',
};

const gameDay = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const gameDayTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '0 0 12px 0',
};

const checklistItem = {
  fontSize: '14px',
  color: '#555555',
  margin: '8px 0',
};

const supportText = {
  fontSize: '14px',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '24px 0 8px 0',
};

const signoff = {
  fontSize: '16px',
  color: '#333333',
  margin: '8px 0',
  textAlign: 'center' as const,
};

export default TicketTransferEmail;