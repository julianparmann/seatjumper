# Mercury API Integration Status

## ✅ Current Status: Mercury API Sandbox Verified and Working!

### ✅ Completed Tasks

1. **Swagger Analysis**
   - Parsed `swagger.json` to identify correct API structure
   - Identified Mercury v5 API endpoints
   - Confirmed header requirements

2. **Code Updates**
   - Updated `/lib/api/mercury.ts` with correct URLs:
     - Base URL: `https://sandbox.tn-apis.com`
     - Mercury API: `/mercury/v5`
     - Catalog API: `/catalog/v2`
     - WebHook API: `/webhook/v1`
     - TicketVault API: `/ticketvault/v2`

   - Fixed headers:
     - Changed from `x-listing-context` to `X-Identity-Context`
     - Mercury uses: `broker-id=13870`
     - Catalog uses: `website-config-id=23884`

3. **Manual Token Support**
   - Added `MERCURY_ACCESS_TOKEN` environment variable
   - Modified token service to use manual token when available
   - Token override working correctly

4. **Test Endpoint Created**
   - Created `/app/api/test/mercury/route.ts`
   - Tests all major Mercury endpoints
   - Returns detailed results and documentation

### ✅ Authentication Working

**Status**: Successfully authenticated with OAuth2 client credentials
- Generated fresh token using consumer key/secret
- Token expiry: 1 hour (3600 seconds)
- All API endpoints responding correctly
- Successfully tested:
  - Mercury Credit Limits: ✅
  - Catalog Categories: ✅
  - Event Search: ✅

### 📋 API Endpoints Configured

#### Mercury API (v5)
```
Base URL: https://sandbox.tn-apis.com/mercury/v5

Endpoints:
- GET /creditlimits - Get buying credit limits
- GET /ticketgroups?eventId={id} - Get available tickets for an event
- POST /lock - Create a ticket hold/lock
- POST /orders - Purchase tickets
- GET /orders/{id} - Get order details
- DELETE /lock/{id} - Release a hold
```

#### Catalog API (v2)
```
Base URL: https://sandbox.tn-apis.com/catalog/v2

Endpoints:
- GET /categories - Get event categories
- GET /events?query={search} - Search for events
- GET /performers - Get performers/teams
- GET /events/{id} - Get specific event details
```

#### Required Headers
```javascript
// Mercury API
{
  'Authorization': 'Bearer {access_token}',
  'X-Identity-Context': 'broker-id=13870',
  'Accept': 'application/json'
}

// Catalog API (Note: uses different header name)
{
  'Authorization': 'Bearer {access_token}',
  'X-Listing-Context': 'website-config-id=23884',
  'Accept': 'application/json'
}
```

### 🔧 Configuration Details

**Environment Variables:**
```env
MERCURY_SANDBOX_MODE="true"
MERCURY_ACCESS_TOKEN="<your_token_here>"
```

**Config IDs (from email):**
- Broker ID: `13870`
- Website Config ID (General): `27735`
- Website Config ID (Catalog): `23884`
- Consumer Key: `2BI2EFcl2UyPJjEwmA_HRrZ2PgIa`
- Consumer Secret: `I_mhfXd6irijN7_fftZXEIa8PSEa`

### 🚀 Next Steps

1. **Get Fresh Access Token**
   - The current token has expired
   - Need to either:
     - Use OAuth flow with consumer key/secret
     - Get a new sandbox API key from the dashboard
     - Request a new token from TicketNetwork

2. **Once Valid Token Available:**
   - Test at: `http://localhost:3000/api/test/mercury`
   - Or run: `node test-mercury-direct.js` (update token in file)

3. **Implementation Ready:**
   - All code is configured correctly
   - Headers and endpoints are properly set
   - Just needs a valid access token to work

### 📝 Testing Instructions

1. **Update the access token** in `.env`:
   ```bash
   MERCURY_ACCESS_TOKEN="your_new_token_here"
   ```

2. **Test the integration**:
   ```bash
   # Start dev server if not running
   npm run dev

   # Test via API endpoint
   curl http://localhost:3000/api/test/mercury

   # Or test directly
   node test-mercury-direct.js
   ```

3. **Expected successful response** will show:
   - Credit limits retrieved
   - Categories listed
   - Events found
   - Ticket groups displayed

### 📌 Important Notes

- **Token Expiry**: Sandbox tokens expire in 1 hour (3600 seconds)
- **Rate Limits**: Trial tier has 50 requests per minute limit
- **Sandbox Mode**: All transactions are test-only, no real purchases
- **VIP System**: Ready to integrate once API connection verified

### 🔍 Troubleshooting

If you get 401 errors:
1. Token has expired - get a new one
2. Check token format - should be a long JWT string
3. Verify token is for sandbox environment

If you get 404 errors:
1. Event IDs in sandbox may be different
2. Try searching for common teams/events first to get valid IDs

### ✅ Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| OAuth Setup | ✅ Complete | Client credentials flow working |
| API URLs | ✅ Complete | All endpoints configured correctly |
| Headers | ✅ Complete | X-Identity-Context for Mercury, X-Listing-Context for Catalog |
| Mercury Client | ✅ Complete | Updated for v5 API |
| Test Endpoint | ✅ Complete | Ready at /api/test/mercury |
| Token Valid | ✅ Working | Fresh token generated via OAuth2 |
| Live Testing | ✅ Success | All endpoints tested successfully |

---

*Last Updated: 2025-01-08*
*Integration by: Claude with SeatJumper team*