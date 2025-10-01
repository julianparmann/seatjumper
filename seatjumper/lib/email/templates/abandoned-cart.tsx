import * as React from 'react';
import { Text, Section, Heading, Img } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, Card, InfoRow } from './components';

interface AbandonedCartEmailProps {
  userName: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  city: string;
  state: string;
  gameId: string;
  bundleQuantity: number;
  attemptedPrice: number;
  eventImageUrl?: string;
  baseUrl?: string;
}

export const AbandonedCartEmail: React.FC<AbandonedCartEmailProps> = ({
  userName,
  eventName,
  eventDate,
  venue,
  city,
  state,
  gameId,
  bundleQuantity,
  attemptedPrice,
  eventImageUrl,
  baseUrl,
}) => {
  const preview = `Still interested in ${eventName}?`;

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

  const baseUrlFinal = baseUrl || 'https://seatjumper.com';
  const eventUrl = `${baseUrlFinal}/play/${gameId}`;
  const eventsUrl = `${baseUrlFinal}/events`;

  return (
    <BaseEmailTemplate preview={preview}>
      <Heading style={heading}>
        Still interested in {eventName}?
      </Heading>

      <Section style={introSection}>
        <Text style={paragraph}>
          Hi {userName},
        </Text>
        <Text style={paragraph}>
          We noticed you were checking out tickets for an amazing event. The game is coming up soon and tickets are still available!
        </Text>
      </Section>

      {eventImageUrl && (
        <Section style={imageSection}>
          <Img
            src={eventImageUrl}
            alt={eventName}
            width="600"
            style={eventImage}
          />
        </Section>
      )}

      <Card title="Event Details" highlighted>
        <Text style={eventTitle}>{eventName}</Text>
        <InfoRow label="Date" value={formatDate(eventDate)} />
        <InfoRow label="Venue" value={venue} />
        <InfoRow label="Location" value={`${city}, ${state}`} />
        {bundleQuantity > 1 && (
          <InfoRow label="Bundle Size" value={`${bundleQuantity} tickets`} />
        )}
        <InfoRow label="Price" value={`$${attemptedPrice.toFixed(2)}`} bold />
      </Card>

      <Section style={ctaSection}>
        <EmailButton href={eventUrl} variant="primary">
          Complete Your Purchase
        </EmailButton>

        <Text style={orText}>or</Text>

        <EmailButton href={eventsUrl}>
          Browse Other Events
        </EmailButton>
      </Section>

      <Section style={reminderSection}>
        <Text style={reminderTitle}>🎯 Why SeatJumper?</Text>
        <Text style={listItem}>• Get randomly assigned premium seats at great prices</Text>
        <Text style={listItem}>• Every jump is a surprise - you could get VIP seats!</Text>
        <Text style={listItem}>• Secure checkout with Stripe</Text>
        <Text style={listItem}>• Instant confirmation</Text>
      </Section>

      <Section style={footerSection}>
        <Text style={footerText}>
          Don't miss out on this event! Tickets are selling fast.
        </Text>
        <Text style={footerText}>
          Questions? Contact us at support@seatjumper.com
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
};

// Styles
const heading: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '24px',
  textAlign: 'center',
};

const introSection: React.CSSProperties = {
  marginBottom: '24px',
};

const paragraph: React.CSSProperties = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4B5563',
  marginBottom: '16px',
};

const imageSection: React.CSSProperties = {
  marginBottom: '24px',
  textAlign: 'center',
};

const eventImage: React.CSSProperties = {
  borderRadius: '8px',
  maxWidth: '100%',
  height: 'auto',
};

const eventTitle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#111827',
  marginBottom: '12px',
};

const ctaSection: React.CSSProperties = {
  marginTop: '32px',
  marginBottom: '32px',
  textAlign: 'center',
};

const orText: React.CSSProperties = {
  fontSize: '14px',
  color: '#9CA3AF',
  margin: '16px 0',
  textAlign: 'center',
};

const reminderSection: React.CSSProperties = {
  backgroundColor: '#FEF3C7',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
};

const reminderTitle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#92400E',
  marginBottom: '12px',
};

const listItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#92400E',
  marginBottom: '6px',
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
  marginBottom: '8px',
};

export default AbandonedCartEmail;