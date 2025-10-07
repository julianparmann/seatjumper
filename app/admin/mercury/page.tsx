'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, Key, Globe, Server } from 'lucide-react';
import { toast } from 'sonner';

interface TokenStatus {
  hasToken: boolean;
  isExpired: boolean;
  apiStatus: 'active' | 'expired' | 'invalid' | 'error' | 'unknown';
  timeRemaining: number;
  expiresAt: string | null;
  tokenDetails: any;
  config: any;
}

export default function MercuryAdminPage() {
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [manualToken, setManualToken] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/mercury/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setTimeLeft(data.timeRemaining || 0);
      } else {
        toast.error('Failed to fetch Mercury API status');
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/mercury/refresh-token', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Token refreshed successfully!');

        // Refresh the status
        await fetchStatus();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error('Error refreshing token');
    } finally {
      setRefreshing(false);
    }
  };

  const saveManualToken = async () => {
    if (!manualToken.trim()) {
      toast.error('Please enter a token');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/mercury/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: manualToken.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Token saved successfully!');
        setManualToken('');

        // Refresh the status after a short delay
        setTimeout(() => {
          fetchStatus();
        }, 1000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save token');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      toast.error('Error saving token');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return 'Expired';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (apiStatus: string) => {
    switch (apiStatus) {
      case 'active': return 'text-green-600';
      case 'expired': return 'text-red-600';
      case 'invalid': return 'text-orange-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (apiStatus: string) => {
    switch (apiStatus) {
      case 'active': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'expired': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'invalid': return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const needsRefresh = !status?.hasToken || status?.isExpired || status?.apiStatus !== 'active';

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mercury API Dashboard</h1>
        <p className="text-gray-600">Manage TicketNetwork Mercury API integration and authentication</p>
      </div>

      {/* Status Alert */}
      {needsRefresh && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {status?.isExpired
              ? 'Your access token has expired. Please refresh to continue using the Mercury API.'
              : 'No valid access token found. Please generate a new token to use the Mercury API.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Token Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API Status</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status?.apiStatus || 'unknown')}
                <span className={`font-medium ${getStatusColor(status?.apiStatus || 'unknown')}`}>
                  {status?.apiStatus?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Status</span>
              <Badge variant={status?.hasToken && !status?.isExpired ? 'default' : 'destructive'}>
                {status?.hasToken ? (status?.isExpired ? 'Expired' : 'Valid') : 'No Token'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Time Remaining</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className={`font-mono ${timeLeft <= 300 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {status?.expiresAt && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500">
                  Expires: {new Date(status.expiresAt).toLocaleString()}
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={refreshToken}
              disabled={refreshing}
              variant={needsRefresh ? 'default' : 'outline'}
            >
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing Token...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {needsRefresh ? 'Generate New Token' : 'Refresh Token'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Manual Token Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Manual Token Input
            </CardTitle>
            <CardDescription>
              Paste a manually generated OAuth token from Mercury API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">JWT Access Token</label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste your JWT token here (eyJ...)"
                className="w-full h-32 px-3 py-2 border rounded-md text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Generate a token manually by running: <br/>
                <code className="bg-gray-100 px-2 py-1 rounded mt-1 block">
                  curl -X POST https://key-manager.tn-apis.com/oauth2/token \<br/>
                  &nbsp;&nbsp;-H "Authorization: Basic {'{Base64(consumerKey:consumerSecret)}'}" \<br/>
                  &nbsp;&nbsp;-H "Content-Type: application/x-www-form-urlencoded" \<br/>
                  &nbsp;&nbsp;-d "grant_type=client_credentials"
                </code>
              </p>
            </div>

            <Button
              className="w-full"
              onClick={saveManualToken}
              disabled={saving || !manualToken.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving Token...
                </>
              ) : (
                'Save Token to .env'
              )}
            </Button>

            {status?.hasToken && (
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500 mb-1">Current Token Preview:</p>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block overflow-x-auto">
                  {status.tokenDetails?.token ?
                    `${status.tokenDetails.token.substring(0, 30)}...${status.tokenDetails.token.substring(status.tokenDetails.token.length - 20)}`
                    : 'No token loaded'}
                </code>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Environment</span>
                <Badge variant="outline">
                  {status?.config?.sandboxMode ? 'Sandbox' : 'Production'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consumer Key</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {status?.config?.consumerKey?.substring(0, 10)}...
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Broker ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {status?.config?.brokerId}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Website Config ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {status?.config?.websiteConfigId}
                </code>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Catalog Config ID</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {status?.config?.catalogConfigId}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Endpoints Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              Mercury API service endpoints for sandbox environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {status?.config?.endpoints && Object.entries(status.config.endpoints).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{key} API</span>
                    <Badge variant="outline" className="text-xs">
                      {key === 'mercury' ? 'v5' : key === 'catalog' ? 'v2' : 'v1'}
                    </Badge>
                  </div>
                  <code className="text-xs bg-gray-100 px-3 py-2 rounded block overflow-x-auto">
                    {value as string}
                  </code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Token Details Card (if available) */}
        {status?.tokenDetails && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Token Information</CardTitle>
              <CardDescription>
                Details from the current JWT access token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Client ID</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {status.tokenDetails.clientId}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Scope</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {status.tokenDetails.scope}
                    </code>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Issued At</span>
                    <span className="text-xs">
                      {status.tokenDetails.issuedAt
                        ? new Date(status.tokenDetails.issuedAt).toLocaleTimeString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expires At</span>
                    <span className="text-xs">
                      {status.tokenDetails.expiresAt
                        ? new Date(status.tokenDetails.expiresAt).toLocaleTimeString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('/api/test/mercury', '_blank')}
            >
              Test API Endpoints
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://console.tn-apis.com', '_blank')}
            >
              TicketNetwork Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}