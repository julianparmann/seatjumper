import * as React from 'react';
import { Text, Section, Heading, Button, Img } from '@react-email/components';
import { BaseEmailTemplate } from './base';

interface MarketingEmailProps {
  userName: string;
  subject: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  previewText?: string;
  unsubscribeUrl: string;
}

export const MarketingEmail: React.FC<MarketingEmailProps> = ({
  userName,
  subject,
  content,
  ctaText,
  ctaUrl,
  previewText,
  unsubscribeUrl,
}) => {
  const preview = previewText || subject;

  // Convert newlines to <br> tags for HTML rendering
  const formattedContent = content.split('\n').map((paragraph, index) => (
    <Text key={index} style={paragraphStyle}>
      {paragraph}
    </Text>
  ));

  return (
    <BaseEmailTemplate
      preview={preview}
      unsubscribeUrl={unsubscribeUrl}
      showFooter={true}
    >
      <Section style={headerSection}>
        <Heading style={heading}>
          {subject}
        </Heading>
      </Section>

      <Section style={contentSection}>
        <Text style={greetingStyle}>
          Hi {userName},
        </Text>

        {formattedContent}

        {ctaText && ctaUrl && (
          <Section style={ctaSection}>
            <Button href={ctaUrl} style={ctaButton}>
              {ctaText}
            </Button>
          </Section>
        )}
      </Section>

      <Section style={dividerSection}>
        <div style={divider} />
      </Section>

      <Section style={footerSection}>
        <Text style={footerText}>
          Thanks for being part of the SeatJumper community!
        </Text>
        <Text style={footerText}>
          Jump for tickets, win prizes, and enjoy the game! 🎫
        </Text>
      </Section>

      <Section style={unsubscribeSection}>
        <Text style={unsubscribeText}>
          You received this email because you opted in to marketing communications from SeatJumper.
        </Text>
        <Text style={unsubscribeText}>
          <a href={unsubscribeUrl} style={unsubscribeLink}>
            Unsubscribe from marketing emails
          </a>
          {' | '}
          <a href="https://seatjumper.com/dashboard/profile" style={unsubscribeLink}>
            Update email preferences
          </a>
        </Text>
      </Section>
    </BaseEmailTemplate>
  );
};

// Styles
const headerSection = {
  marginBottom: '32px',
};

const heading = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#333333',
  textAlign: 'center' as const,
  margin: '0',
  lineHeight: '1.3',
};

const contentSection = {
  marginBottom: '32px',
};

const greetingStyle = {
  fontSize: '18px',
  color: '#333333',
  marginBottom: '20px',
};

const paragraphStyle = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#333333',
  margin: '16px 0',
};

const ctaSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const ctaButton = {
  backgroundColor: '#facc15',
  borderRadius: '8px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 28px',
  display: 'inline-block',
};

const dividerSection = {
  margin: '32px 0',
};

const divider = {
  borderTop: '1px solid #e1e4e8',
};

const footerSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const footerText = {
  fontSize: '16px',
  color: '#666666',
  margin: '8px 0',
};

const unsubscribeSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
  paddingTop: '16px',
  borderTop: '1px solid #e1e4e8',
};

const unsubscribeText = {
  fontSize: '12px',
  color: '#999999',
  margin: '4px 0',
};

const unsubscribeLink = {
  color: '#999999',
  textDecoration: 'underline',
};

export default MarketingEmail;