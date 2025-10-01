import dotenv from 'dotenv';
dotenv.config();

console.log('Environment variables check:');
console.log('MAILGUN_API_KEY exists:', !!process.env.MAILGUN_API_KEY);
console.log('MAILGUN_DOMAIN exists:', !!process.env.MAILGUN_DOMAIN);
console.log('MAILGUN_DOMAIN value:', process.env.MAILGUN_DOMAIN || 'NOT SET');

// Clear the module cache to force re-instantiation with env vars loaded
delete require.cache[require.resolve('./lib/email/mailgun')];

// Now import after env vars are loaded
const { mailgunService } = require('./lib/email/mailgun');

async function testMailgun() {
  console.log('\nMailgun service check:');
  console.log('Is configured:', mailgunService.isEmailConfigured());

  if (!mailgunService.isEmailConfigured()) {
    console.log('\n❌ Mailgun is NOT configured properly');
    console.log('Please ensure you have both MAILGUN_API_KEY and MAILGUN_DOMAIN in your .env file');
    return;
  }

  console.log('\n✅ Mailgun appears to be configured');
  console.log('Attempting to send test email...');

  const result = await mailgunService.sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    text: 'This is a test',
    html: '<p>This is a test</p>'
  });

  console.log('Send result:', result);
}

testMailgun();