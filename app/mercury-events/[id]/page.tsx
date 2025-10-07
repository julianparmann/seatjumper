'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  MapPin,
  Loader2,
  Package,
  Trophy,
  Sparkles,
  Info,
  CheckCircle,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

interface PackType {
  type: 'blue' | 'red' | 'gold';
  name: string;
  description: string;
  color: string;
  bgGradient: string;
  features: string[];
  icon: React.ReactNode;
}

interface EventDetails {
  id: string;
  name: string;
  date: string;
  venue: {
    name: string;
    city: string;
    state: string;
  };
  performers: Array<{
    name: string;
    primary: boolean;
  }>;
  category: {
    name: string;
  };
}

interface PackPricing {
  blue: number;
  red: number;
  gold: number;
  inventoryCount: {
    blue: number;
    red: number;
    gold: number;
  };
}

const PACK_TYPES: PackType[] = [
  {
    type: 'blue',
    name: 'Blue Pack',
    description: 'All available seats',
    color: 'text-blue-500',
    bgGradient: 'from-blue-500 to-blue-600',
    features: [
      'Access to all sections',
      'Best value option',
      'Includes upper deck seats',
      'Perfect for first-time jumpers'
    ],
    icon: <Package className="w-6 h-6" />
  },
  {
    type: 'red',
    name: 'Red Pack',
    description: 'Lower bowl & better seats',
    color: 'text-red-500',
    bgGradient: 'from-red-500 to-red-600',
    features: [
      'Excludes upper deck',
      'Better view guaranteed',
      'Mid-tier sections only',
      'Great for regular fans'
    ],
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    type: 'gold',
    name: 'Gold Pack',
    description: 'Premium seats only',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-500 to-yellow-600',
    features: [
      'Lower bowl only',
      'Club & suite level access',
      'Premium sections',
      'VIP experience possible'
    ],
    icon: <Trophy className="w-6 h-6" />
  }
];

const BUNDLE_SIZES = [
  { value: 1, label: '1x', description: 'Single ticket' },
  { value: 2, label: '2x', description: 'Pair of tickets' },
  { value: 3, label: '3x', description: 'Group of 3' },
  { value: 4, label: '4x', description: 'Group of 4' }
];

export default function MercuryEventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [pricing, setPricing] = useState<PackPricing | null>(null);
  const [selectedPack, setSelectedPack] = useState<'blue' | 'red' | 'gold'>('blue');
  const [bundleSize, setBundleSize] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventDetails();
  }, [params.id]);

  useEffect(() => {
    if (event) {
      fetchPricing();
    }
  }, [event, selectedPack, bundleSize]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mercury-events/${params.id}`);
      if (!response.ok) throw new Error('Failed to load event');
      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    try {
      setLoadingPricing(true);
      const response = await fetch(
        `/api/mercury-events/${params.id}/pricing?pack=${selectedPack}&bundleSize=${bundleSize}`
      );
      if (!response.ok) throw new Error('Failed to load pricing');
      const data = await response.json();
      setPricing(data);
    } catch (err) {
      console.error('Pricing error:', err);
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleJump = async () => {
    if (!session) {
      router.push('/login?redirect=' + encodeURIComponent(`/mercury-events/${params.id}`));
      return;
    }

    // Navigate to checkout with selected options
    const checkoutParams = new URLSearchParams({
      eventId: params.id,
      pack: selectedPack,
      bundleSize: bundleSize.toString(),
      price: pricing?.[selectedPack]?.toString() || '0'
    });

    router.push(`/checkout?${checkoutParams.toString()}`);
  };

  const formatEventDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy " h:mm a');
    } catch {
      return dateString;
    }
  };

  const getPrimaryPerformer = (performers: any[]) => {
    const primary = performers?.find(p => p.primary);
    return primary?.name || performers?.[0]?.name || 'Event';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Event not found'}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push('/mercury-events')}>
          Back to Events
        </Button>
      </div>
    );
  }

  const selectedPackInfo = PACK_TYPES.find(p => p.type === selectedPack)!;
  const currentPrice = pricing?.[selectedPack] || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Event Header */}
      <div className="mb-8">
        <Badge className="mb-2">{event.category?.name}</Badge>
        <h1 className="text-4xl font-bold mb-2">
          {getPrimaryPerformer(event.performers)}
        </h1>
        <p className="text-xl text-muted-foreground mb-4">
          {event.name}
        </p>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>{formatEventDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{event.venue.name} " {event.venue.city}, {event.venue.state}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Pack Selection */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Your Pack</CardTitle>
              <CardDescription>
                Choose the tier of seats you want to spin for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {PACK_TYPES.map((pack) => (
                  <Card
                    key={pack.type}
                    className={`cursor-pointer transition-all ${
                      selectedPack === pack.type
                        ? 'ring-2 ring-primary shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPack(pack.type)}
                  >
                    <CardHeader className="pb-3">
                      <div className={`flex items-center gap-2 ${pack.color}`}>
                        {pack.icon}
                        <span className="font-semibold">{pack.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pack.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {pack.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {pricing && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm text-muted-foreground">From</span>
                            <span className="text-2xl font-bold">
                              ${pricing[pack.type]?.toFixed(0)}
                            </span>
                          </div>
                          {pricing.inventoryCount && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {pricing.inventoryCount[pack.type]} tickets available
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bundle Size Selection */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Bundle Size</h3>
                <div className="grid grid-cols-4 gap-3">
                  {BUNDLE_SIZES.map((bundle) => (
                    <Button
                      key={bundle.value}
                      variant={bundleSize === bundle.value ? 'default' : 'outline'}
                      onClick={() => setBundleSize(bundle.value)}
                      className="flex flex-col h-auto py-3"
                    >
                      <span className="text-lg font-bold">{bundle.label}</span>
                      <span className="text-xs opacity-75">{bundle.description}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Jump Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Selected Pack */}
                <div className="p-3 rounded-lg bg-muted">
                  <div className={`flex items-center gap-2 ${selectedPackInfo.color} mb-1`}>
                    {selectedPackInfo.icon}
                    <span className="font-semibold">{selectedPackInfo.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPackInfo.description}
                  </p>
                </div>

                {/* Bundle Size */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Bundle Size</span>
                  <span className="font-semibold">{bundleSize}x tickets</span>
                </div>

                {/* VIP Chance */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>VIP Chance:</strong> 0.02% chance of winning premium seats worth 5x+ the average!
                  </AlertDescription>
                </Alert>

                {/* Price */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Total Price</span>
                    <div className="text-right">
                      {loadingPricing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <div className="text-3xl font-bold">
                            ${(currentPrice * bundleSize).toFixed(0)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ${currentPrice.toFixed(0)} per ticket
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Jump Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleJump}
                  disabled={loadingPricing || !pricing}
                >
                  <DollarSign className="mr-2 h-5 w-5" />
                  Jump for ${(currentPrice * bundleSize).toFixed(0)}
                </Button>

                {/* Info Text */}
                <p className="text-xs text-center text-muted-foreground">
                  You'll receive {bundleSize} randomly selected {selectedPack} pack ticket{bundleSize > 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}