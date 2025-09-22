import * as React from 'react';
import { Text, Section, Heading } from '@react-email/components';
import { BaseEmailTemplate } from './base';
import { EmailButton, Card, AlertBox } from './components';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  userEmail,
}) => {
  const preview = `Welcome to SeatJumper, ${userName}!`;

  return (
    <BaseEmailTemplate preview={preview}>
      <Heading style={heading}>
        Welcome to SeatJumper, {userName}! 🎉
      </Heading>

      <Text style={paragraph}>
        We're thrilled to have you join the SeatJumper community! You're now part of an exciting platform where you can jump for amazing game tickets and exclusive memorabilia.
      </Text>

      <AlertBox type="success">
        Your account has been successfully created with the email: {userEmail}
      </AlertBox>

      <Card title="How SeatJumper Works">
        <Text style={listItem}>
          <strong>1. Browse Events:</strong> Explore upcoming games across NFL, NBA, MLB, NHL, and more
        </Text>
        <Text style={listItem}>
          <strong>2. Jump In:</strong> Enter a jump for a chance to win ticket bundles plus memorabilia
        </Text>
        <Text style={listItem}>
          <strong>3. Spin & Win:</strong> Watch the excitement unfold as you discover your prizes
        </Text>
        <Text style={listItem}>
          <strong>4. Enjoy:</strong> Receive your tickets and collectibles delivered right to you
        </Text>
      </Card>

      <Section style={{ marginTop: '32px' }}>
        <Heading as="h2" style={subheading}>
          What Makes SeatJumper Special?
        </Heading>

        <Text style={paragraph}>
          <strong>🎫 Premium Tickets:</strong> Access to the best seats at major sporting events
        </Text>
        <Text style={paragraph}>
          <strong>🏆 Exclusive Memorabilia:</strong> Authentic sports collectibles and trading cards
        </Text>
        <Text style={paragraph}>
          <strong>💰 Amazing Value:</strong> Bundle prices that give you more for less
        </Text>
        <Text style={paragraph}>
          <strong>🎮 Fun Experience:</strong> The thrill of the spin adds excitement to every jump
        </Text>
      </Section>

      <EmailButton href="https://seatjumper.com/events">
        Browse Upcoming Events
      </EmailButton>

      <Section style={{ marginTop: '32px' }}>
        <Text style={paragraph}>
          <strong>Need Help Getting Started?</strong>
        </Text>
        <Text style={paragraph}>
          Check out our <a href="https://seatjumper.com/help" style={link}>Help Center</a> or reply to this email - we're here to help!
        </Text>
      </Section>

      <Text style={signoff}>
        Good luck with your first jump!
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