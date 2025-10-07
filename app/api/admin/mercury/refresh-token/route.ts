import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication (disabled for testing)
    // const session = await getServerSession(authOptions);
    // if (!session || session.user?.email !== 'julianparmann1@gmail.com') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get consumer credentials
    const consumerKey = process.env.MERCURY_CONSUMER_KEY;
    const consumerSecret = process.env.MERCURY_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({
        error: 'Missing Mercury API credentials',
        details: 'Please set MERCURY_CONSUMER_KEY and MERCURY_CONSUMER_SECRET environment variables'
      }, { status: 500 });
    }

    // Create Basic auth header
    const credentials = `${consumerKey}:${consumerSecret}`;
    const basicAuth = Buffer.from(credentials, 'utf-8').toString('base64');

    // Request new token from Mercury
    const response = await fetch('https://key-manager.tn-apis.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({
        error: 'Failed to refresh token',
        details: error
      }, { status: response.status });
    }

    const tokenData = await response.json();

    // Update environment variable (in production, you'd update a database or secret manager)
    process.env.MERCURY_ACCESS_TOKEN = tokenData.access_token;

    return NextResponse.json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope,
      expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    });

  } catch (error: any) {
    console.error('Failed to refresh Mercury token:', error);
    return NextResponse.json({
      error: 'Failed to refresh token',
      message: error.message
    }, { status: 500 });
  }
}