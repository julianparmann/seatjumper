import * as React from 'react';
import { Text, Section, Heading } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, AlertBox } from './components';

interface PasswordChangedEmailProps {
  userName: string;
  userEmail: string;
  changedAt: Date;
}

export const PasswordChangedEmail: React.FC<PasswordChangedEmailProps> = ({
  userName,
  userEmail,
  changedAt,
}) => {
  const preview = 'Your SeatJumper password has been changed';

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  };

  return (
    <BaseEmailTemplate preview={preview}>
      <Heading style={heading}>
        Password Changed Successfully
      </Heading>

      <Text style={paragraph}>
        Hi {userName},
      </Text>

      <Text style={paragraph}>
        Your SeatJumper password was successfully changed on:
      </Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          <strong>{formatDate(changedAt)}</strong>
        </Text>
        <Text style={infoText}>
          Account: {userEmail}
        </Text>
      </Section>

      <AlertBox type="warning">
        If you didn't make this change, please take immediate action:
      </AlertBox>

      <Section style={{ marginTop: '24px' }}>
        <Text style={paragraph}>
          <strong>Didn't change your password?</strong>
        </Text>
        <Text style={listItem}>
          1. Reset your password immediately using the link below
        </Text>
        <Text style={listItem}>
          2. Check your account for any unauthorized activity
        </Text>
        <Text style={listItem}>
          3. Contact our support team if you notice anything suspicious
        </Text>
      </Section>

      <EmailButton href="https://seatjumper.com/auth/forgot-password">
        Reset Password Now
      </EmailButton>

      <Section style={{ marginTop: '32px' }}>
        <Text style={paragraph}>
          <strong>Security Recommendations:</strong>
        </Text>
        <Text style={listItem}>
          • Use a unique password for your SeatJumper account
        </Text>
        <Text style={listItem}>
          • Enable two-factor authentication when available
        </Text>
        <Text style={listItem}>
          • Never share your password with anyone
        </Text>
        <Text style={listItem}>
          • Be cautious of phishing emails asking for your password
        </Text>
      </Section>

      <Text style={signoff}>
        Stay secure,
      </Text>
      <Text style={signoff}>
        The SeatJumper Security Team
      </Text>
    </BaseEmailTemplate>
  );
};

// Styles
const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#333333',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  margin: '16px 0',
};

const infoBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const infoText = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#333333',
  margin: '8px 0',
};

const listItem = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#555555',
  margin: '8px 0',
  paddingLeft: '8px',
};

const signoff = {
  fontSize: '16px',
  color: '#333333',
  margin: '8px 0',
};

export default PasswordChangedEmail;