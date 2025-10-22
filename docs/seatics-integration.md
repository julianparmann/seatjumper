# Seatics Maps Integration Documentation

## Overview
SeatJumper now integrates with TicketNetwork's Seatics Maps API to provide interactive venue maps alongside Mercury ticket inventory. This enhancement allows users to visually explore venues and select sections for their jump pool.

## Key Features

### 1. Interactive Venue Maps
- Full venue visualization with section-level detail
- Color-coded sections by price tier (Budget, Standard, Premium, VIP)
- Hover tooltips showing section details
- Click-to-select section interaction
- Pan and zoom capabilities

### 2. View from Seat
- Preview what the view looks like from specific sections
- High-resolution seat view images
- Accessible from both map and list views
- Modal viewer with section information

### 3. Synchronized Selection
- Seamless sync between map and list views
- Real-time jump price updates
- Pool size calculations based on selected sections
- Select All / Clear All functionality

## Architecture

### Components

#### `components/seatics/VenueMapSelector.tsx`
Main component for rendering the interactive venue map. Features:
- Seatics MapComponent integration
- Section selection handling
- Hover state management
- View from Seat trigger

#### `components/seatics/SeatViewModal.tsx`
Modal component for displaying seat view images. Features:
- Full-screen image viewer
- Section information display
- Navigation between multiple views
- Error handling for missing images

#### `components/seatics/SeaticsScriptLoader.tsx`
Handles loading jQuery and Seatics framework scripts. Features:
- Dependency management
- Script loading order
- Global object initialization
- Error handling

### API Integration

#### `lib/api/seatics.ts`
Seatics API client with:
- OAuth token management (shared with Mercury)
- Event and venue search
- Map data fetching
- JSONP callback handling

#### `lib/services/seatics-mercury-mapper.ts`
Service for mapping between Mercury inventory and Seatics sections:
- Section name normalization
- Price tier categorization
- Inventory aggregation
- Selection state management

#### `app/api/events/[id]/venue-map/route.ts`
API endpoint that:
- Fetches Mercury inventory
- Retrieves Seatics map data
- Merges and formats data for frontend
- Handles missing map data gracefully

## Configuration

### Environment Variables
Add these to your `.env.local` file:

```bash
# Seatics Maps API Configuration
# Note: Uses same OAuth credentials as Mercury
SEATICS_API_URL="https://sandbox.tn-apis.com/maps/v3"
SEATICS_FRAMEWORK_URL="https://mapwidget3-sandbox.seatics.com/Api/framework"
SEATICS_VFS_BASE_URL="https://vfs.seatics.com"
SEATICS_SANDBOX_MODE="true"

# Production URLs (when ready):
# SEATICS_API_URL="https://www.tn-apis.com/maps/v3"
# SEATICS_FRAMEWORK_URL="https://mapwidget3.seatics.com/Api/framework"
# SEATICS_SANDBOX_MODE="false"
```

### Configuration File
See `lib/config/seatics.ts` for:
- API endpoints
- Visual settings (colors, interactions)
- Price tier thresholds
- Framework URLs

## Usage

### For Users

1. **Viewing the Map**
   - Navigate to an event page
   - Click "Venue Map" button to switch to map view
   - Map loads automatically if available

2. **Selecting Sections**
   - Click sections on the map to include/exclude them
   - Selected sections appear highlighted in blue
   - Use "Select All" or "Clear All" for bulk actions
   - Switch between Map and List views as needed

3. **Viewing Seat Previews**
   - Hover over sections to see details
   - Click "View from Seat" button (eye icon)
   - Modal opens with seat view image
   - Navigate between nearby sections if available

4. **Understanding the Pool**
   - Selected sections form your "jump pool"
   - Jump price reflects the average wholesale cost
   - Pool size shows total ticket options
   - Final seat assignment happens after payment

### For Developers

#### Adding Map Support to New Pages

```typescript
// 1. Import required components
import VenueMapSelector from '@/components/seatics/VenueMapSelector';
import SeaticsScriptLoader from '@/components/seatics/SeaticsScriptLoader';

// 2. Load venue map data
const venueMapData = await fetch(`/api/events/${eventId}/venue-map`);

// 3. Add script loader
<SeaticsScriptLoader onLoad={() => setSeaticsLoaded(true)} />

// 4. Render map when ready
{venueMapData?.mapData?.hasMap && seaticsLoaded && (
  <VenueMapSelector
    eventId={eventId}
    venueData={venueMapData}
    selectedSections={selectedSectionsSet}
    onSectionToggle={handleSectionToggle}
    onSelectAll={handleSelectAll}
    onClearAll={handleClearAll}
    jumpPrice={jumpPrice}
    poolSize={poolSize}
  />
)}
```

#### Customizing Price Tiers

Edit `lib/config/seatics.ts`:

```typescript
export const seaticsConfig = {
  visual: {
    priceColors: {
      budget: '#4ade80',   // Green
      standard: '#fbbf24', // Yellow
      premium: '#fb923c',  // Orange
      vip: '#c084fc',      // Purple
    },
    // Adjust thresholds (0-100 percentile)
    priceThresholds: {
      budget: 25,
      standard: 50,
      premium: 75,
      vip: 100,
    }
  }
};
```

## Troubleshooting

### Map Not Loading
1. Check if event has venue data in Mercury
2. Verify Seatics credentials in .env
3. Check browser console for script errors
4. Ensure jQuery loaded before Seatics

### Section Names Don't Match
- The mapper normalizes section names
- Check `lib/services/seatics-mercury-mapper.ts`
- Common patterns handled: "Section 101" vs "101"
- Case-insensitive matching

### View from Seat Not Available
- Not all sections have VFS images
- Check `viewFromSeatUrl` in API response
- Premium/VIP sections more likely to have images

### OAuth Token Issues
- Tokens expire after 1 hour
- Automatic refresh implemented
- Check Mercury credentials if persistent issues

## Testing

Run the test verification script:
```bash
npx tsx scripts/test-map-sync.ts
```

Manual testing checklist:
1. Section selection synchronization
2. Jump price recalculation
3. Select All / Clear All functionality
4. View from Seat modal
5. Map/List view toggle
6. Pool size updates

## Future Enhancements

Potential improvements:
- Seat-level selection (when available)
- 3D venue views
- Accessibility preferences
- Mobile gesture support
- Offline map caching
- Heat map pricing visualization
- Historical availability trends