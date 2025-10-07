import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mercuryTokenService } from '@/lib/services/mercury-token-service';

// Helper to decode JWT without verification (just for expiry check)
function parseJWT(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication (disabled for testing)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user?.email !== 'julianparmann1@gmail.com') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const currentToken = process.env.MERCURY_ACCESS_TOKEN;
    const tokenInfo = mercuryTokenService.getTokenInfo();

    // Parse the token to get expiry information
    let tokenDetails = null;
    let expiresAt = null;
    let isExpired = true;
    let timeRemaining = 0;

    if (currentToken) {
      const decoded = parseJWT(currentToken);
      if (decoded) {
        tokenDetails = {
          clientId: decoded.client_id,
          scope: decoded.scope,
          issuer: decoded.iss,
          issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
          expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null,
        };

        if (decoded.exp) {
          expiresAt = new Date(decoded.exp * 1000);
          const now = Date.now();
          timeRemaining = Math.max(0, (decoded.exp * 1000) - now);
          isExpired = timeRemaining <= 0;
        }
      }
    }

    // Test the token by making a simple API call
    let apiStatus = 'unknown';
    if (currentToken && !isExpired) {
      try {
        const testResponse = await fetch('https://sandbox.tn-apis.com/mercury/v5/creditlimits', {
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'X-Identity-Context': 'broker-id=13870',
          }
        });
        apiStatus = testResponse.ok ? 'active' : 'invalid';
      } catch {
        apiStatus = 'error';
      }
    } else {
      apiStatus = 'expired';
    }

    // Configuration details
    const config = {
      sandboxMode: process.env.MERCURY_SANDBOX_MODE === 'true',
      consumerKey: process.env.MERCURY_CONSUMER_KEY || '2BI2EFcl2UyPJjEwmA_HRrZ2PgIa',
      brokerId: process.env.MERCURY_BROKER_ID || '13870',
      websiteConfigId: process.env.MERCURY_WEBSITE_CONFIG_ID || '27735',
      catalogConfigId: process.env.MERCURY_CATALOG_CONFIG_ID || '23884',
      endpoints: {
        mercury: 'https://sandbox.tn-apis.com/mercury/v5',
        catalog: 'https://sandbox.tn-apis.com/catalog/v2',
        webhook: 'https://sandbox.tn-apis.com/webhook/v1',
        ticketvault: 'https://sandbox.tn-apis.com/ticketvault/v2',
      }
    };

    return NextResponse.json({
      hasToken: !!currentToken,
      isExpired,
      apiStatus,
      timeRemaining: Math.floor(timeRemaining / 1000), // in seconds
      expiresAt: expiresAt?.toISOString() || null,
      tokenDetails,
      tokenInfo: tokenInfo.valid ? tokenInfo : null,
      config
    });

  } catch (error: any) {
    console.error('Failed to get Mercury status:', error);
    return NextResponse.json({
      error: 'Failed to get status',
      message: error.message
    }, { status: 500 });
  }
}