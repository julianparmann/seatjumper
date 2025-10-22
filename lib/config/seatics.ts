/**
 * Seatics Maps API Configuration
 * Handles integration with TicketNetwork's Seatics mapping service
 */

export const seaticsConfig = {
  // API URLs
  api: {
    sandbox: {
      baseUrl: 'https://sandbox.tn-apis.com/maps/v3',
      frameworkScript: 'https://mapwidget3-sandbox.seatics.com/Api/framework',
      vfsUrl: 'https://vfs.seatics.com', // View from Seat images
    },
    production: {
      baseUrl: 'https://www.tn-apis.com/maps/v3',
      frameworkScript: 'https://mapwidget3.seatics.com/Api/framework',
      vfsUrl: 'https://vfs.seatics.com',
    }
  },

  // Environment settings
  isSandbox: process.env.SEATICS_SANDBOX_MODE === 'true',

  // TicketNetwork credentials
  credentials: {
    websiteConfigId: process.env.SEATICS_WEBSITE_CONFIG_ID || '690', // Will be provided by TicketNetwork
    consumerKey: process.env.SEATICS_CONSUMER_KEY || '', // Must be set in environment
    brokerId: process.env.SEATICS_BROKER_ID || '', // Optional, for Mercury integration
  },

  // Map configuration defaults
  mapDefaults: {
    mapWidth: 600,
    mapHeight: 600,
    enableSectionInfoPopups: true,
    enableMultiSelect: true,
    showZoomControls: true,
    mouseWheelZoomEnabled: true,
  },

  // Visual configuration
  visual: {
    // Price tier colors (budget to premium)
    priceColors: {
      budget: '#4ade80',    // Green
      standard: '#fbbf24',  // Yellow
      premium: '#fb923c',   // Orange
      vip: '#c084fc',       // Purple
    },

    // Map color scheme
    levelColors: [
      '#4ade80', '#86efac', // Greens (budget)
      '#fbbf24', '#fde047', // Yellows (standard)
      '#fb923c', '#fdba74', // Oranges (premium)
      '#c084fc', '#e9d5ff', // Purples (VIP)
      '#94a3b8', '#cbd5e1', // Grays (unavailable)
    ],

    // Selection colors
    selectionColor: '#3b82f6', // Blue for selected sections
    hoverColor: '#60a5fa',     // Light blue for hover
    unavailableColor: '#6b7280', // Gray for no inventory
  },

  // Interaction settings
  interaction: {
    selectionScheme: 1, // 0 = desaturate unselected, 1 = highlight selected
    hoverEnabled: true,
    largeScreenFormat: true,
    multiSelectMode: true,
    showTooltips: true,
  },

  // Feature flags
  features: {
    showViewFromSeat: true,
    showSectionPricing: true,
    showAvailability: true,
    enableComparison: false, // Future feature
    enableLegend: true,
  }
};

/**
 * Get the appropriate API URL based on environment
 */
export function getSeaticsApiUrl(): string {
  return seaticsConfig.isSandbox
    ? seaticsConfig.api.sandbox.baseUrl
    : seaticsConfig.api.production.baseUrl;
}

/**
 * Get the framework script URL based on environment
 */
export function getSeaticsFrameworkUrl(): string {
  return seaticsConfig.isSandbox
    ? seaticsConfig.api.sandbox.frameworkScript
    : seaticsConfig.api.production.frameworkScript;
}

/**
 * Build the API call URL for event/venue info
 */
export function buildSeaticsApiUrl(params: {
  eventId?: string;
  eventName?: string;
  venue?: string;
  dateTime: string; // Format: yyyyMMddHHmm
}): string {
  const baseUrl = getSeaticsApiUrl();
  const { websiteConfigId, consumerKey } = seaticsConfig.credentials;

  const queryParams = new URLSearchParams({
    websiteConfigId,
    consumerKey,
    dateTime: params.dateTime,
  });

  if (params.eventId) {
    queryParams.append('eventId', params.eventId);
  } else {
    if (params.eventName) queryParams.append('eventName', params.eventName);
    if (params.venue) queryParams.append('venue', params.venue);
  }

  return `${baseUrl}/EventAndVenueInfo?callback=handleSeaticsData&${queryParams.toString()}`;
}

/**
 * Price category calculation based on price percentile
 */
export function getPriceCategory(price: number, minPrice: number, maxPrice: number): 'budget' | 'standard' | 'premium' | 'vip' {
  if (minPrice === maxPrice) return 'standard';

  const range = maxPrice - minPrice;
  const percentile = ((price - minPrice) / range) * 100;

  if (percentile <= 25) return 'budget';
  if (percentile <= 50) return 'standard';
  if (percentile <= 75) return 'premium';
  return 'vip';
}

/**
 * Get color for price category
 */
export function getPriceCategoryColor(category: 'budget' | 'standard' | 'premium' | 'vip'): string {
  return seaticsConfig.visual.priceColors[category];
}