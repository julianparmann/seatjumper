import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeLeadEmailProps {
  email: string;
}

export default function WelcomeLeadEmail({ email }: WelcomeLeadEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SeatJumper - You're early. That's the best seat.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://seatjumper.com/logo.png"
            width="150"
            height="50"
            alt="SeatJumper"
            style={logo}
          />

          <Section style={content}>
            <Text style={paragraph}>
              Here's the deal: most fans don't really have a choice. Either pay way too much for a decent view… or settle for the rafters and call it "the experience."
            </Text>

            <Text style={paragraph}>
              <strong>That's broken.</strong>
            </Text>

            <Text style={paragraph}>
              SeatJumper is built to change that. Every Jump will hand out something—tickets, prizes, maybe even a front-row surprise. No wasted plays.
            </Text>

            <Text style={paragraph}>
              You just got in ahead of the crowd. Which means when we launch, you'll hear it here first. And trust me, moving early always beats chasing late.
            </Text>

            <Text style={signOff}>
              Welcome aboard,<br />
              —Team SeatJumper
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            © {new Date().getFullYear()} SeatJumper. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#0f0f23',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
};

const logo = {
  margin: '0 auto 40px',
  display: 'block' as const,
};

const content = {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  padding: '30px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const paragraph = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '20px',
};

const signOff = {
  color: '#ffffff',
  fontSize: '16px',
  lineHeight: '26px',
  marginTop: '30px',
  marginBottom: '0',
};

const hr = {
  borderColor: 'rgba(255, 255, 255, 0.2)',
  margin: '40px 0 20px',
};

const footer = {
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '14px',
  textAlign: 'center' as const,
};