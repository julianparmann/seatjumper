import Mailgun from 'mailgun.js';
import FormData from 'form-data';

interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  tags?: string[];
  variables?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class MailgunService {
  private client: any;
  private domain: string;
  private fromEmail: string;
  private fromName: string;
  private isConfigured: boolean;

  constructor() {
    // Remove quotes from env variables if present
    const apiKey = process.env.MAILGUN_API_KEY?.replace(/^["']|["']$/g, '');
    const domain = process.env.MAILGUN_DOMAIN?.replace(/^["']|["']$/g, '');
    const fromEmail = process.env.MAILGUN_FROM_EMAIL?.replace(/^["']|["']$/g, '') || 'noreply@seatjumper.com';
    const fromName = process.env.MAILGUN_FROM_NAME?.replace(/^["']|["']$/g, '') || 'SeatJumper';

    // console.log('Mailgun constructor - checking configuration:', {
    //   hasApiKey: !!apiKey,
    //   apiKeyLength: apiKey?.length || 0,
    //   domain: domain || 'NOT SET',
    //   fromEmail,
    //   fromName
    // });

    this.domain = domain || '';
    this.fromEmail = fromEmail;
    this.fromName = fromName;
    this.isConfigured = !!(apiKey && domain);

    if (this.isConfigured) {
      const mailgun = new Mailgun(FormData);
      this.client = mailgun.client({
        username: 'api',
        key: apiKey!,
        url: 'https://api.mailgun.net' // US region
      });
    } else {
      console.warn('Mailgun is not configured. Emails will be logged but not sent.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Ensure we have a recipient
      if (!options.to) {
        throw new Error('No recipient specified');
      }

      // Format the from field
      const from = options.from || `${this.fromName} <${this.fromEmail}>`;

      // Prepare email data
      const emailData: any = {
        from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
        'h:Reply-To': options.replyTo || 'support@seatjumper.com',
      };

      // Add optional fields
      if (options.cc) {
        emailData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      }
      if (options.bcc) {
        emailData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      }
      if (options.tags && options.tags.length > 0) {
        emailData['o:tag'] = options.tags;
      }
      if (options.variables) {
        emailData['h:X-Mailgun-Variables'] = JSON.stringify(options.variables);
      }
      if (options.attachments) {
        emailData.attachment = options.attachments;
      }

      // If not configured, log the email instead of sending
      if (!this.isConfigured) {
        console.log('📧 Email would be sent:', {
          to: emailData.to,
          subject: emailData.subject,
          from: emailData.from,
          preview: options.text?.substring(0, 100)
        });

        return {
          success: true,
          messageId: 'test-' + Date.now(),
          error: undefined
        };
      }

      // Send the email via Mailgun
      const result = await this.client.messages.create(this.domain, emailData);


      return {
        success: true,
        messageId: result.id,
        error: undefined
      };
    } catch (error: any) {
      console.error('❌ Failed to send email:', error);

      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  // Convenience method for sending templated emails
  async sendTemplatedEmail(
    to: string | string[],
    subject: string,
    templateHtml: string,
    templateText?: string,
    options: Partial<EmailOptions> = {}
  ): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject,
      html: templateHtml,
      text: templateText || this.htmlToText(templateHtml),
      ...options
    });
  }

  // Simple HTML to text conversion for fallback
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Check if email service is configured
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }

  // Validate email address
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Batch send emails with rate limiting
  async sendBatch(
    emails: EmailOptions[],
    delayMs: number = 100
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}

// Export singleton instance
export const mailgunService = new MailgunService();

// Export the class and types for testing
export { MailgunService };
export type { EmailOptions, EmailResult };