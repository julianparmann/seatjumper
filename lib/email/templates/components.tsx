import * as React from 'react';
import { Button, Text, Section, Row, Column, Img } from '@react-email/components';

// Button Component
interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export const EmailButton: React.FC<EmailButtonProps> = ({
  href,
  children,
  variant = 'primary'
}) => {
  const style = variant === 'primary' ? primaryButton : secondaryButton;

  return (
    <Section style={{ textAlign: 'center', margin: '32px 0' }}>
      <Button href={href} style={style}>
        {children}
      </Button>
    </Section>
  );
};

// Info Row Component
interface InfoRowProps {
  label: string;
  value: string | React.ReactNode;
  bold?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, bold = false }) => {
  return (
    <Row style={infoRow}>
      <Column style={{ width: '40%' }}>
        <Text style={infoLabel}>{label}:</Text>
      </Column>
      <Column style={{ width: '60%' }}>
        <Text style={bold ? infoBoldValue : infoValue}>{value}</Text>
      </Column>
    </Row>
  );
};

// Alert Box Component
interface AlertBoxProps {
  type: 'success' | 'warning' | 'info' | 'error';
  children: React.ReactNode;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ type, children }) => {
  const colors = {
    success: { bg: '#d4edda', border: '#c3e6cb', text: '#155724' },
    warning: { bg: '#fff3cd', border: '#ffeeba', text: '#856404' },
    info: { bg: '#d1ecf1', border: '#bee5eb', text: '#0c5460' },
    error: { bg: '#f8d7da', border: '#f5c6cb', text: '#721c24' },
  };

  const style = {
    backgroundColor: colors[type].bg,
    border: `1px solid ${colors[type].border}`,
    borderRadius: '4px',
    color: colors[type].text,
    padding: '12px 20px',
    margin: '16px 0',
  };

  return (
    <Section style={style}>
      <Text style={{ margin: 0, color: colors[type].text }}>
        {children}
      </Text>
    </Section>
  );
};

// Card Component
interface CardProps {
  title?: string;
  children: React.ReactNode;
  highlighted?: boolean;
}

export const Card: React.FC<CardProps> = ({ title, children, highlighted = false }) => {
  const cardStyle = highlighted ? highlightedCard : normalCard;

  return (
    <Section style={cardStyle}>
      {title && (
        <Text style={cardTitle}>{title}</Text>
      )}
      {children}
    </Section>
  );
};

// Price Display Component
interface PriceDisplayProps {
  label: string;
  amount: number;
  currency?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  label,
  amount,
  currency = '$',
  size = 'medium',
  color = '#333333'
}) => {
  const sizes = {
    small: '16px',
    medium: '24px',
    large: '32px',
  };

  return (
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Text style={{ fontSize: '14px', color: '#666666', margin: '0 0 8px 0' }}>
        {label}
      </Text>
      <Text style={{
        fontSize: sizes[size],
        fontWeight: 'bold',
        color,
        margin: 0
      }}>
        {currency}{amount.toFixed(2)}
      </Text>
    </Section>
  );
};

// Divider Component
export const Divider: React.FC = () => (
  <Section style={{ margin: '24px 0' }}>
    <div style={{ height: '1px', backgroundColor: '#e1e4e8' }} />
  </Section>
);

// Styles
const primaryButton = {
  backgroundColor: '#facc15',
  borderRadius: '8px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
};

const secondaryButton = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '2px solid #667eea',
  color: '#667eea',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
  display: 'inline-block',
};

const infoRow = {
  marginBottom: '12px',
};

const infoLabel = {
  fontSize: '14px',
  color: '#666666',
  margin: 0,
};

const infoValue = {
  fontSize: '14px',
  color: '#333333',
  margin: 0,
};

const infoBoldValue = {
  fontSize: '14px',
  color: '#333333',
  fontWeight: 'bold',
  margin: 0,
};

const normalCard = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
};

const highlightedCard = {
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  border: '2px solid #ffc107',
  padding: '20px',
  margin: '16px 0',
};

const cardTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#333333',
  marginBottom: '12px',
  marginTop: 0,
};