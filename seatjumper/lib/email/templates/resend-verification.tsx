import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton } from './components';

interface ResendVerificationEmailProps {
  userName: string;
  verificationToken: string;
  verificationUrl: string;
}

export const ResendVerificationEmail: React.FC<ResendVerificationEmailProps> = ({
  userName,
  verificationToken,
  verificationUrl,
}) => {
  const preview = `Verify your email to start jumping!`;

  return (
    <BaseEmailTemplate preview={preview}>
      <Text style={heading}>
        🎟️ Hey {userName}!
      </Text>

      <Text style={paragraph}>
        We know you want to jump into the game, but you gotta verify your email first!
      </Text>

      <Text style={paragraph}>
        Click the button below and you'll be jumping higher than Cheech and Chong on a trampoline 🤸
      </Text>

      <Section style={{ margin: '32px 0' }}>
        <EmailButton href={verificationUrl}>
          Verify My Email & Let's Jump!
        </EmailButton>
      </Section>

      <Text style={smallText}>
        This link will expire in 24 hours. If you didn't try to sign in, you can safely ignore this email.
      </Text>

      <Text style={signoff}>
        See you at the game!
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
  margin: '24px 0',
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
  margin: '24px 0',
};

const signoff = {
  fontSize: '16px',
  color: '#333333',
  margin: '8px 0',
};

export default ResendVerificationEmail;
