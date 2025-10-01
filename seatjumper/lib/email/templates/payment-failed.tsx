import * as React from 'react';
import { Text, Section, Heading } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, Card, InfoRow, Divider } from './components';

interface PaymentFailedEmailProps {
  userName: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  city: string;
  state: string;
  attemptedAmount: number;
  failureReason?: string;
  gameId: string;
  baseUrl?: string;
}

export const PaymentFailedEmail: React.FC<PaymentFailedEmailProps> = ({
  userName,
  eventName,
  eventDate,
  venue,
  city,
  state,
  attemptedAmount,
  failureReason = 'Your payment could not be processed',
  gameId,
  baseUrl,
}) => {
  const preview = `Payment failed for ${eventName}`;

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

  const retryUrl = `${baseUrl || 'https://seatjumper.com'}/play/${gameId}`;

  return (
    <BaseEmailTemplate preview={preview}>
      <Section style={warningBanner}>
        <Text style={warningText}>⚠️ Payment Failed</Text>
        <Text style={warningSubtext}>We couldn't process your payment</Text>
      </Section>

      <Heading style={heading}>
        Hi {userName},
      </Heading>

      <Section style={messageSection}>
        <Text style={paragraph}>
          Unfortunately, your payment of ${attemptedAmount.toFixed(2)} for <strong>{eventName}</strong> could not be processed.
        </Text>

        <Card highlighted>
          <InfoRow label="Reason" value={failureReason} />
          <InfoRow label="Amount Attempted" value={`$${attemptedAmount.toFixed(2)}`} />
        </Card>
      </Section>

      <Divider />

      <Card title="Event Details">
        <Text style={eventTitle}>{eventName}</Text>
        <InfoRow label="Date" value={formatDate(eventDate)} />
        <InfoRow label="Venue" value={venue} />
        <InfoRow label="Location" value={`${city}, ${state}`} />
      </Card>

      <Section style={ctaSection}>
        <Text style={paragraph}>
          Don't worry! The tickets are still available. You can try again with a different payment method.
        </Text>

        <EmailButton href={retryUrl} variant="primary">
          Try Again
        </EmailButton>
      </Section>

      <Section style={helpSection}>
        <Text style={helpText}>
          <strong>Common reasons for payment failure:</strong>
        </Text>
        <Text style={listItem}>• Insufficient funds</Text>
        <Text style={listItem}>• Card declined by bank</Text>
        <Text style={listItem}>• Incorrect card details</Text>
        <Text style={listItem}>• Card expired</Text>
      </Section>

      <Section style={footerSection}>
        <Text style={footerText}>
          Need help? Contact our support team at support@seatjumper.com
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
};

// Styles
const warningBanner: React.CSSProperties = {
  backgroundColor: '#FEF2F2',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center',
  marginBottom: '24px',
};

const warningText: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#DC2626',
  margin: '0 0 8px 0',
};

const warningSubtext: React.CSSProperties = {
  fontSize: '14px',
  color: '#7F1D1D',
  margin: '0',
};

const heading: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '16px',
};

const messageSection: React.CSSProperties = {
  marginBottom: '24px',
};

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4B5563',
  marginBottom: '16px',
};

const eventTitle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '12px',
};

const ctaSection: React.CSSProperties = {
  marginTop: '32px',
  marginBottom: '32px',
  textAlign: 'center',
};

const helpSection: React.CSSProperties = {
  backgroundColor: '#F9FAFB',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '24px',
};

const helpText: React.CSSProperties = {
  fontSize: '14px',
  color: '#111827',
  marginBottom: '8px',
};

const listItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B7280',
  marginBottom: '4px',
  paddingLeft: '8px',
};

const footerSection: React.CSSProperties = {
  borderTop: '1px solid #E5E7EB',
  paddingTop: '24px',
  textAlign: 'center',
};

const footerText: React.CSSProperties = {
  fontSize: '14px',
  color: '#6B7280',
};

export default PaymentFailedEmail;