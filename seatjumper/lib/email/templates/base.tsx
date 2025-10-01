import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Img,
  Hr,
  Preview,
} from '@react-email/components';

interface BaseEmailTemplateProps {
  preview: string;
  children: React.ReactNode;
  unsubscribeUrl?: string;
  showFooter?: boolean;
}

export const BaseEmailTemplate: React.FC<BaseEmailTemplateProps> = ({
  preview,
  children,
  unsubscribeUrl,
  showFooter = true,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>🎫 SeatJumper</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          {showFooter && (
            <>
              <Hr style={divider} />
              <Section style={footer}>
                <Text style={footerText}>
                  © {new Date().getFullYear()} SeatJumper. All rights reserved.
                </Text>
                <Text style={footerText}>
                  Your ultimate destination for game tickets.
                </Text>
                {unsubscribeUrl && (
                  <Text style={footerText}>
                    <Link href={unsubscribeUrl} style={footerLink}>
                      Unsubscribe
                    </Link>{' '}
                    | <Link href="https://seatjumper.com/privacy" style={footerLink}>
                      Privacy Policy
                    </Link>
                  </Text>
                )}
              </Section>
            </>
          )}
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 20px',
  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  background: '#667eea',
};

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#ffffff',
  textAlign: 'center' as const,
  margin: '0',
};

const content = {
  padding: '32px 20px',
};

const divider = {
  borderColor: '#e6ebf1',
  margin: '42px 20px',
};

const footer = {
  padding: '0 20px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '8px 0',
};

const footerLink = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textDecoration: 'underline',
};

export default BaseEmailTemplate;