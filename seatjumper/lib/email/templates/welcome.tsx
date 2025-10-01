import * as React from 'react';
import { Text, Section, Heading } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, Card, AlertBox } from './components';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  verificationToken?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  userEmail,
  verificationToken,
}) => {
  const preview = `Thanks for joining SeatJumper`;

  return (
    <BaseEmailTemplate preview={preview}>
      <Text style={paragraph}>
        Hey {userName},
      </Text>

      <Text style={paragraph}>
        Thanks for joining SeatJumper.
      </Text>

      <Text style={paragraph}>
        Here's the fun part: with SeatJumper, you can land in seats worth $5,000 — front row, right on the action — for little more than what you'd normally pay for the worst seats in the house. That's the magic of the jump.
      </Text>

      <Text style={paragraph}>
        And don't worry, you're not rolling blind. Hate sitting in the endzone? Filter it out. Only jump from a pool of tickets you'd actually be happy with.
      </Text>

      <Text style={paragraph}>
        So here's what to do next:
      </Text>

      <Text style={listItem}>
        • Browse the games you care about
      </Text>
      <Text style={listItem}>
        • Set your filters
      </Text>
      <Text style={listItem}>
        • Take your jump and see where you land
      </Text>

      <Text style={paragraph}>
        That's it.
      </Text>

      <Text style={paragraph}>
        This started as a simple idea to make buying tickets fun again, and you're one of the first people to try it. If anything feels confusing, reply to support@seatjumper.com — you'll reach our team, not a support bot.
      </Text>

      <Text style={paragraph}>
        Glad you're here. Let's make this fun.
      </Text>

      {verificationToken && (
        <Section style={{ margin: '32px 0' }}>
          <Text style={paragraph}>
            <strong>One quick thing:</strong> Click below to verify your email so you can start jumping!
          </Text>
          <EmailButton href={`https://seatjumper.com/auth/verify-email?token=${verificationToken}`}>
            Verify My Email
          </EmailButton>
        </Section>
      )}

      <Text style={signoff}>
        —Art
      </Text>
      <Text style={signoff}>
        Founder, SeatJumper
      </Text>

      <Section style={{ marginTop: '32px' }}>
        <Text style={paragraph}>
          P.S. Your first jump's the most exciting one. Don't overthink it — pick a game and go.
        </Text>
      </Section>
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

const listItem = {
  fontSize: '15px',
  lineHeight: '22px',
  color: '#555555',
  margin: '12px 0',
  paddingLeft: '8px',
};

const link = {
  color: '#667eea',
  textDecoration: 'underline',
};

const signoff = {
  fontSize: '16px',
  color: '#333333',
  margin: '8px 0',
};

export default WelcomeEmail;