#!/bin/bash

# Mercury API Token Refresh Script
# Generates a fresh OAuth2 access token for Mercury API

echo "Refreshing Mercury API access token..."

# Consumer credentials
CONSUMER_KEY="2BI2EFcl2UyPJjEwmA_HRrZ2PgIa"
CONSUMER_SECRET="I_mhfXd6irijN7_fftZXEIa8PSEa"

# Generate Base64 auth
AUTH_HEADER=$(echo -n "${CONSUMER_KEY}:${CONSUMER_SECRET}" | base64)

# Request new token
RESPONSE=$(curl -s -X POST https://key-manager.tn-apis.com/oauth2/token \
  -d "grant_type=client_credentials" \
  -H "Authorization: Basic ${AUTH_HEADER}" \
  -H "Content-Type: application/x-www-form-urlencoded")

# Extract token
ACCESS_TOKEN=$(echo $RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -n "$ACCESS_TOKEN" ]; then
  echo "✅ Token generated successfully!"
  echo ""
  echo "Add this to your .env file:"
  echo "MERCURY_ACCESS_TOKEN=\"${ACCESS_TOKEN}\""
  echo ""
  echo "Token expires in 1 hour (3600 seconds)"
else
  echo "❌ Failed to generate token"
  echo "Response: $RESPONSE"
fi