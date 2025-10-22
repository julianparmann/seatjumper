'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  DollarSign,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  XCircle,
  Wallet
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface CreditLimits {
  dailyBuyCreditLimit: { value: number; currencyCode: string };
  dailyBuyCreditRemaining: { value: number; currencyCode: string };
  weeklyBuyCreditLimit: { value: number; currencyCode: string };
  weeklyBuyCreditRemaining: { value: number; currencyCode: string };
  coinBuyCreditRemaining: { value: number; currencyCode: string };
  mercuryActive: boolean;
  canBuy: boolean;
  canSell: boolean;
  coinWalletEnabled: boolean;
  buyFee: number;
  sellFee: number;
}

export default function MercuryCreditPage() {
  const [creditLimits, setCreditLimits] = useState<CreditLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchCreditLimits = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/mercury-credit');

      if (!response.ok) {
        throw new Error('Failed to fetch credit limits');
      }

      const data = await response.json();
      setCreditLimits(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching credit limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credit limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditLimits();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchCreditLimits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePercentage = (remaining: number, limit: number) => {
    if (limit === 0) return 0;
    return (remaining / limit) * 100;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage > 50) return 'text-green-500';
    if (percentage > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading && !creditLimits) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!creditLimits) {
    return null;
  }

  const dailyPercentage = calculatePercentage(
    creditLimits.dailyBuyCreditRemaining.value,
    creditLimits.dailyBuyCreditLimit.value
  );

  const weeklyPercentage = calculatePercentage(
    creditLimits.weeklyBuyCreditRemaining.value,
    creditLimits.weeklyBuyCreditLimit.value
  );

  const lowestCredit = Math.min(
    creditLimits.dailyBuyCreditRemaining.value,
    creditLimits.weeklyBuyCreditRemaining.value,
    creditLimits.coinBuyCreditRemaining.value
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mercury Credit Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your Mercury API credit limits and usage</p>
        </div>
        <Button
          onClick={fetchCreditLimits}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Mercury Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {creditLimits.mercuryActive ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <Badge variant="destructive">Inactive</Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Buy Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {creditLimits.canBuy ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-semibold">Enabled</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-600 font-semibold">Disabled</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available to Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <span className={`text-2xl font-bold ${getStatusColor(lowestCredit > 1000 ? 100 : (lowestCredit / 10))}`}>
                {formatCurrency(lowestCredit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Limit Warnings */}
      {lowestCredit < 5000 && (
        <Alert className="mb-6" variant={lowestCredit < 1000 ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Credit Warning</AlertTitle>
          <AlertDescription>
            Your available Mercury credit is {formatCurrency(lowestCredit)}.
            {lowestCredit < 1000
              ? ' Immediate action required to add funds.'
              : ' Consider topping up your account soon.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Credit Limits Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Credit Limits</CardTitle>
            <CardDescription>24-hour rolling window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Daily Limit</span>
                  <span className="text-sm">{formatCurrency(creditLimits.dailyBuyCreditLimit.value)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Remaining</span>
                  <span className={`text-sm font-bold ${getStatusColor(dailyPercentage)}`}>
                    {formatCurrency(creditLimits.dailyBuyCreditRemaining.value)}
                  </span>
                </div>
                <Progress
                  value={dailyPercentage}
                  className="h-2"
                  style={{
                    backgroundColor: '#e5e7eb',
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {dailyPercentage.toFixed(1)}% remaining
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span>Used Today</span>
                  <span className="font-semibold">
                    {formatCurrency(creditLimits.dailyBuyCreditLimit.value - creditLimits.dailyBuyCreditRemaining.value)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Limits */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Credit Limits</CardTitle>
            <CardDescription>7-day rolling window</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Weekly Limit</span>
                  <span className="text-sm">{formatCurrency(creditLimits.weeklyBuyCreditLimit.value)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Remaining</span>
                  <span className={`text-sm font-bold ${getStatusColor(weeklyPercentage)}`}>
                    {formatCurrency(creditLimits.weeklyBuyCreditRemaining.value)}
                  </span>
                </div>
                <Progress
                  value={weeklyPercentage}
                  className="h-2"
                  style={{
                    backgroundColor: '#e5e7eb',
                  }}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {weeklyPercentage.toFixed(1)}% remaining
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm">
                  <span>Used This Week</span>
                  <span className="font-semibold">
                    {formatCurrency(creditLimits.weeklyBuyCreditLimit.value - creditLimits.weeklyBuyCreditRemaining.value)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Balance */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Coin Wallet Balance
          </CardTitle>
          <CardDescription>Pre-funded account balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">
                {formatCurrency(creditLimits.coinBuyCreditRemaining.value)}
              </p>
              {creditLimits.coinWalletEnabled ? (
                <Badge variant="default" className="mt-2">Enabled</Badge>
              ) : (
                <Badge variant="secondary" className="mt-2">Disabled</Badge>
              )}
            </div>
            {creditLimits.coinBuyCreditRemaining.value < 10000 && (
              <Alert className="max-w-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Consider topping up your wallet balance
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fees */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Buy Fee</p>
              <p className="text-2xl font-bold">{(creditLimits.buyFee * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Sell Fee</p>
              <p className="text-2xl font-bold">{(creditLimits.sellFee * 100).toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Last updated: {lastRefresh.toLocaleString()}
      </div>
    </div>
  );
}