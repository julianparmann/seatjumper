// Simple test to check if env vars are loading
require('dotenv').config();

console.log('Current working directory:', process.cwd());
console.log('\nEnvironment variables check:');
console.log('MAILGUN_API_KEY exists:', !!process.env.MAILGUN_API_KEY);
console.log('MAILGUN_API_KEY length:', process.env.MAILGUN_API_KEY ? process.env.MAILGUN_API_KEY.length : 0);
console.log('MAILGUN_DOMAIN:', process.env.MAILGUN_DOMAIN);

// Also check if the domain matches what's in the Java example
if (process.env.MAILGUN_DOMAIN) {
  console.log('\n✅ MAILGUN_DOMAIN is set to:', process.env.MAILGUN_DOMAIN);
  console.log('Expected: mg.seatjumper.com');
}