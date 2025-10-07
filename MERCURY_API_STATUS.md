# Mercury API Integration Status

## Current Status: Partial Success

### ✅ Working Components

1. **OAuth Authentication**
   - Successfully authenticating with Mercury OAuth server
   - Token acquisition and refresh working correctly
   - Consumer Key and Secret validated
   - Token endpoint: `https://key-manager.tn-apis.com/oauth2/token`

2. **VIP Randomization System**
   - 1-in-5000 (0.0002) probability implemented
   - Separate rolls for tickets and memorabilia
   - Expected value calculations integrated into pricing
   - Database fields added for tracking VIP wins

3. **Configuration**
   - x-listing-context headers properly configured
   - Correct website-config-id values (27735 for general, 23884 for catalog)
   - broker-id properly set (13870)
   - All credentials stored securely

### ❌ Blocked Issues

1. **API Endpoints Unreachable**
   - All API domains (catalog, mercury, webhook, ticketvault) cannot be resolved via DNS
   - Attempted domains:
     - `sandbox.tn-apis.com`
     - `api.tn-apis.com`
     - `api-gateway.tn-apis.com`
     - Individual service domains like `sandbox.catalog.tn-apis.com`

2. **Likely Causes**
   - APIs may be behind a VPN or require IP whitelisting
   - May need to access through a specific DevPortal URL first
   - Sandbox environment might have restricted access

### 📋 Next Steps Required

To complete the Mercury API integration, you'll need to:

1. **Contact TicketNetwork Support** to clarify:
   - The exact API endpoint URLs to use
   - Whether VPN access or IP whitelisting is required
   - If there's a specific DevPortal URL to access first
   - Whether the sandbox environment has network restrictions

2. **Once URLs are confirmed**, update them in:
   - `/lib/api/mercury.ts` constructor
   - Or set environment variables:
     - `MERCURY_API_URL`
     - `MERCURY_CATALOG_API_URL`
     - `MERCURY_WEBHOOK_API_URL`
     - `MERCURY_TICKETVAULT_API_URL`

3. **Test the integration** at `http://localhost:3000/api/test/mercury`

### 🔧 Technical Details

**Email Credentials Provided:**
- Consumer Key: `2BI2EFcl2UyPJjEwmA_HRrZ2PgIa`
- Consumer Secret: `I_mhfXd6irijN7_fftZXEIa8PSEa`
- Website Config ID (General): `27735`
- Website Config ID (Catalog): `23884`
- Broker ID: `13870`

**Application:** TestApplication (subscribed to all required APIs)

**API Workflow:**
1. Catalog API → Retrieve categories, events, and performers
2. Mercury API → Retrieve ticket groups, lock tickets, purchase tickets
3. WebHook API → Order update notifications
4. TicketVault API → Retrieve electronic ticket PDFs

### 🚀 Ready Components

Once the API endpoints are accessible, the following are ready to use:
- OAuth token management with auto-renewal
- VIP prize system with proper randomization
- Pricing calculations including VIP expected value
- Database schema for Mercury integration
- API client with proper error handling

## Environment Variables

```env
# Mercury API (Currently set in .env)
MERCURY_SANDBOX_MODE="true"

# Optional - Set these once you have the correct URLs
MERCURY_API_URL=""
MERCURY_CATALOG_API_URL=""
MERCURY_WEBHOOK_API_URL=""
MERCURY_TICKETVAULT_API_URL=""
```

## Testing

Once API endpoints are accessible, test at:
```
http://localhost:3000/api/test/mercury
```

This will validate:
- OAuth token acquisition
- Category retrieval
- Event search
- Inventory retrieval
- VIP randomization