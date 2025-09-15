export interface TicketInventory {
  id: string;
  section: string;
  row: string;
  seatNumbers: string[];
  price: number;
  quantity: number;
}

export interface EventDetails {
  id: string;
  name: string;
  sport: Sport;
  venue: string;
  city: string;
  state?: string;
  datetime: Date;
  minPrice?: number;
  maxPrice?: number;
  averagePrice?: number;
  inventoryCount?: number;
  tickets?: TicketInventory[];
}

export interface BreakDetails {
  id: string;
  sport: Sport;
  productName: string;
  breakDate: Date;
  price: number;
  spotsAvailable?: number;
  spotsTotal?: number;
  breaker: string;
  streamUrl?: string;
}

export interface SpinResult {
  tickets: TicketInventory;
  break: BreakDetails;
  totalValue: number;
}

export interface RiskProfile {
  capBreakWin?: number;
  uncapTickets?: boolean;
  minSeatQuality?: string;
  preferredSections?: string[];
}

export enum Sport {
  NFL = 'NFL',
  NBA = 'NBA',
  MLB = 'MLB',
  NHL = 'NHL',
  SOCCER = 'SOCCER',
  UFC = 'UFC',
  F1 = 'F1',
  OTHER = 'OTHER'
}

export interface TicketEvolutionEvent {
  id: number;
  name: string;
  occurs_at: string;
  venue: {
    id: number;
    name: string;
    city: string;
    state?: string;
  };
  configuration: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    name: string;
  };
  popularity_score?: number;
}

export interface TicketEvolutionTicket {
  id: number;
  section: string;
  row: string;
  seat_numbers: string;
  quantity: number;
  price: number;
  splits: number[];
  ticket_group: {
    id: number;
    type: string;
  };
}