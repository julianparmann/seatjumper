# SeatJumper MVP Completion Plan

## Date: January 15, 2025
## Goal: Complete working MVP with real game flow

### Phase 1: Inventory Strategy Decision
- [x] Decided on broker model with manual inventory entry
- [x] Admin will manually enter ticket costs
- [x] Scraper for sports card bundles

### Phase 2: Admin Game Management
#### Current Task: Build Admin Dashboard
- [x] Add DailyGame and ManualTicket models to schema
- [x] Fix duplicate model issues in schema
- [x] Run migrations
- [x] Create /admin/inventory page
- [x] Build form for creating games with tickets
- [x] Add ticket cost input for each ticket
- [x] Display games in /events page
- [x] Create API routes for inventory management
- [x] Add game management page
- [ ] Test with sample data

### Phase 3: Payment Integration (Stripe)
- [ ] Set up Stripe account
- [ ] Add Stripe SDK to project
- [ ] Create payment intent endpoint
- [ ] Add payment UI before spin
- [ ] Handle payment success/failure

### Phase 4: Complete Game Flow
- [x] Fix stadium jumper animation - COMPLETED
  - [x] Create Allegiant Stadium layout data
  - [x] Build SVG-based stadium visualization
  - [x] Implement light trail animation
  - [x] Integrate with existing jump flow
  - [x] Test animation with sample data

  **Implementation Summary:**
  - Created `/data/stadiums/allegiant.ts` with accurate section mappings
  - Built `AllegiantStadiumAnimation` component with SVG visualization
  - Added light trail effect that jumps between sections
  - Integrated animation to trigger after API response
  - Animation shows for ~3-4 seconds before displaying final result
- [ ] Fix card pack wheel spin
- [ ] Implement winner selection logic
- [ ] Store game results in database
- [ ] Create winner notification

### Phase 5: Ticket Fulfillment
- [ ] Create fulfillment dashboard
- [ ] If broker model: Manual purchase flow
- [ ] If estimated: Clear demo messaging
- [ ] Email notifications to winners
- [ ] Tracking system for delivery

### Phase 6: Sports Card Integration
- [ ] Define card pack tiers/values
- [ ] Source card inventory (or partner)
- [ ] Add to prize bundle
- [ ] Fulfillment process for cards

### Phase 7: Testing & Launch
- [ ] End-to-end test with test payment
- [ ] Create first real game
- [ ] Soft launch to friends/family
- [ ] Gather feedback
- [ ] Iterate based on results

## Notes:
- Keep everything simple for MVP
- Manual processes are OK initially
- Focus on proving the concept
- Can automate later

## Review Section:
### January 15, 2025 - Admin Dashboard Implementation

#### What was completed:
1. **Database Schema Updates**
   - Added DailyGame, ManualTicket, and GameEntry models
   - Fixed duplicate model issues from previous implementation
   - Successfully migrated database with new models

2. **Admin Inventory Management Page** (`/admin/inventory`)
   - Full form for creating games with event details
   - Dynamic ticket inventory management (add/remove tickets)
   - Card pack bundle configuration
   - Automatic pricing calculation (35% of total value)
   - Real-time pricing summary display

3. **API Routes**
   - `/api/admin/inventory` - GET and POST for game management
   - `/api/admin/games/[id]` - PATCH for status updates, DELETE for removal

4. **Admin Games Management Page** (`/admin/games`)
   - View all created games with details
   - Toggle game status (DRAFT/ACTIVE)
   - Visual indicators for game status
   - Quick navigation to create new games

5. **Events Page Updates** (`/events`)
   - Displays active games in featured section
   - Shows bundle details (tickets + card packs)
   - Entry price prominently displayed
   - Separate sections for daily games and upcoming events

#### Key Decisions:
- Implemented broker model where admin manually enters ticket inventory
- Used 35% pricing model for entry fees
- Separated daily games from regular event scraping
- Maintained existing NextAuth admin authentication

#### Next Steps:
- Test creating a game with sample data
- Implement Stripe payment integration
- Fix stadium jumper animation
- Add winner selection logic