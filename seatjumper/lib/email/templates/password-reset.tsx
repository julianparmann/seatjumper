import * as React from 'react';
import { Text, Section, Heading } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, AlertBox } from './components';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresInHours?: number;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  userName,
  resetUrl,
  expiresInHours = 24,
}) => {
  const preview = 'Reset your SeatJumper password';

  return (
    <BaseEmailTemplate preview={preview}>
      <Heading style={heading}>
        Password Reset Request
      </Heading>

      <Text style={paragraph}>
        Hi {userName},
      </Text>

      <Text style={paragraph}>
        We received a request to reset your SeatJumper password. Click the button below to create a new password:
      </Text>

      <EmailButton href={resetUrl}>
        Reset Your Password
      </EmailButton>

      <AlertBox type="warning">
        This password reset link will expire in {expiresInHours} hours. If you didn't request this password reset, you can safely ignore this email.
      </AlertBox>

      <Section style={{ marginTop: '32px' }}>
        <Text style={smallText}>
          If the button above doesn't work, you can copy and paste this link into your browser:
        </Text>
        <Text style={linkText}>
          {resetUrl}
        </Text>
      </Section>

      <Section style={{ marginTop: '32px' }}>
        <Text style={paragraph}>
          <strong>Security Tips:</strong>
        </Text>
        <Text style={listItem}>
          • Never share your password with anyone
        </Text>
        <Text style={listItem}>
          • SeatJumper will never ask for your password via email
        </Text>
        <Text style={listItem}>
          • Use a strong, unique password for your account
        </Text>
      </Section>

      <Text style={signoff}>
        Stay secure,
      </Text>
      <Text style={signoff}>
        The SeatJumper Team
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

const smallText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#666666',
  margin: '8px 0',
};

const linkText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#667eea',
  wordBreak: 'break-all' as const,
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

export default PasswordResetEmail;