import * as React from 'react';
import { Text, Section, Heading } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, Card, InfoRow, AlertBox } from './components';

interface ShippingItem {
  name: string;
  description?: string;
  quantity: number;
}

interface ShippingEmailProps {
  userName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery?: Date;
  shippingAddress: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: ShippingItem[];
  trackingUrl?: string;
}

export const ShippingEmail: React.FC<ShippingEmailProps> = ({
  userName,
  orderNumber,
  trackingNumber,
  carrier,
  estimatedDelivery,
  shippingAddress,
  items,
  trackingUrl,
}) => {
  const preview = `Your SeatJumper prizes have shipped!`;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getCarrierTrackingUrl = () => {
    if (trackingUrl) return trackingUrl;

    switch (carrier.toUpperCase()) {
      case 'USPS':
        return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
      case 'UPS':
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
      case 'FEDEX':
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
      case 'DHL':
        return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${trackingNumber}`;
      default:
        return null;
    }
  };

  const finalTrackingUrl = getCarrierTrackingUrl();

  return (
    <BaseEmailTemplate preview={preview}>
      <Section style={shippingBanner}>
        <Text style={shippingIcon}>📦</Text>
        <Text style={shippingText}>Your Order Has Shipped!</Text>
      </Section>

      <Heading style={heading}>
        Shipping Confirmation
      </Heading>

      <Text style={paragraph}>
        Hi {userName},
      </Text>

      <Text style={paragraph}>
        Great news! Your SeatJumper prizes have been shipped and are on their way to you.
      </Text>

      <Card title="Tracking Information" highlighted>
        <InfoRow label="Order Number" value={`#${orderNumber}`} />
        <InfoRow label="Carrier" value={carrier.toUpperCase()} />
        <InfoRow label="Tracking Number" value={trackingNumber} bold />
        {estimatedDelivery && (
          <InfoRow label="Estimated Delivery" value={formatDate(estimatedDelivery)} />
        )}
      </Card>

      {finalTrackingUrl && (
        <EmailButton href={finalTrackingUrl}>
          Track Your Package
        </EmailButton>
      )}

      <Card title="Items Shipped">
        {items.map((item, index) => (
          <Section key={index} style={itemRow}>
            <Text style={itemName}>
              {item.quantity > 1 && `(${item.quantity}x) `}{item.name}
            </Text>
            {item.description && (
              <Text style={itemDescription}>{item.description}</Text>
            )}
          </Section>
        ))}
      </Card>

      <Card title="Shipping Address">
        <Text style={addressText}>{shippingAddress.street1}</Text>
        {shippingAddress.street2 && (
          <Text style={addressText}>{shippingAddress.street2}</Text>
        )}
        <Text style={addressText}>
          {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
        </Text>
      </Card>

      <AlertBox type="info">
        <strong>Package Delivery:</strong> {carrier.toUpperCase()} typically delivers Monday-Saturday during business hours.
        No signature is required unless specified by the carrier.
      </AlertBox>

      <Section style={deliveryTips}>
        <Heading as="h2" style={subheading}>
          Delivery Tips
        </Heading>

        <Text style={tipItem}>
          <strong>📍 Track Your Package:</strong> Use the tracking number to monitor your package's journey and get real-time updates.
        </Text>

        <Text style={tipItem}>
          <strong>🏠 Delivery Location:</strong> Packages are typically left at your door. Consider having it held at a carrier location if you won't be home.
        </Text>

        <Text style={tipItem}>
          <strong>📸 Delivery Confirmation:</strong> Most carriers provide photo confirmation of delivery for added security.
        </Text>

        <Text style={tipItem}>
          <strong>⏰ Missed Delivery:</strong> If you miss the delivery, check for a notice with redelivery instructions.
        </Text>
      </Section>

      <Section style={whatToExpect}>
        <Text style={expectTitle}>What to Expect:</Text>
        <Text style={expectItem}>
          • Your items will arrive in secure SeatJumper packaging
        </Text>
        <Text style={expectItem}>
          • All prizes are carefully wrapped for protection
        </Text>
        <Text style={expectItem}>
          • Items are shipped in protective packaging
        </Text>
        <Text style={expectItem}>
          • Authenticity certificates included where applicable
        </Text>
      </Section>

      <EmailButton href={`https://seatjumper.com/orders/${orderNumber}`} variant="secondary">
        View Order Details
      </EmailButton>

      <Text style={supportText}>
        <strong>Questions about your shipment?</strong>
      </Text>
      <Text style={supportText}>
        Reply to support@seatjumper.com with order #{orderNumber} and your issue
      </Text>

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
const shippingBanner = {
  backgroundColor: '#d1ecf1',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const shippingIcon = {
  fontSize: '48px',
  margin: '0 0 8px 0',
};

const shippingText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#0c5460',
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

const itemRow = {
  borderBottom: '1px solid #e1e4e8',
  paddingBottom: '12px',
  marginBottom: '12px',
};

const itemName = {
  fontSize: '15px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '4px 0',
};

const itemDescription = {
  fontSize: '13px',
  color: '#666666',
  margin: '4px 0',
};

const addressText = {
  fontSize: '14px',
  color: '#333333',
  margin: '4px 0',
};

const deliveryTips = {
  marginTop: '32px',
};

const tipItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#555555',
  margin: '12px 0',
  paddingLeft: '8px',
};

const whatToExpect = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const expectTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#333333',
  margin: '0 0 12px 0',
};

const expectItem = {
  fontSize: '14px',
  color: '#555555',
  margin: '8px 0',
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

export default ShippingEmail;