// Manual webhook test to simulate Stripe webhook call
const crypto = require('crypto');

// Your webhook secret
const webhookSecret = 'whsec_HG6i7n1PaEAuG6hx4dRGpDcQUKJx7oYW';

// Create a test payload that mimics a Stripe checkout.session.completed event
const testPayload = {
  id: 'evt_test_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_' + Date.now(),
      object: 'checkout.session',
      amount_total: 5000, // $50.00
      currency: 'usd',
      customer_email: 'test@example.com',
      payment_intent: 'pi_test_' + Date.now(),
      payment_status: 'paid',
      status: 'complete',
      metadata: {
        userId: 'cmg85enqj000004l2ci6me23w', // Valid user ID from DB
        eventId: '5205180', // Event with confirmed inventory
        eventName: 'Test Event',
        eventVenue: 'Test Venue',
        eventDate: new Date().toISOString(),
        quantity: '2',
        excludedSections: '',
        selectedTicketIds: ''
      }
    }
  }
};

const payload = JSON.stringify(testPayload);

// Generate Stripe signature
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;
const expectedSig = crypto
  .createHmac('sha256', webhookSecret)
  .update(signedPayload)
  .digest('hex');

const signature = `t=${timestamp},v1=${expectedSig}`;

// Send the webhook
console.log('Sending test webhook to http://localhost:3000/api/stripe/webhook');
console.log('Event type:', testPayload.type);
console.log('Session ID:', testPayload.data.object.id);
console.log('Event ID (Mercury):', testPayload.data.object.metadata.eventId);

fetch('http://localhost:3000/api/stripe/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': signature
  },
  body: payload
})
  .then(res => res.text())
  .then(result => {
    console.log('Webhook response:', result);
  })
  .catch(err => {
    console.error('Error sending webhook:', err);
  });