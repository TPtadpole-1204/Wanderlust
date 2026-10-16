export interface Coordinates {
  lat: number;
  lng: number;
}

export type PlaceCategory = 'sightseeing' | 'food' | 'shopping' | 'stay' | 'transport' | 'entertainment' | 'other';

export interface TransportOption {
  mode: 'walk' | 'subway' | 'bus' | 'taxi' | 'bullet_train' | 'car';
  durationMinutes: number;
  distanceText?: string;
  cost?: number;
  routes?: { label: string; url: string }[];
}

export interface ItineraryItem {
  id: string;
  time: string; // e.g. "09:30"
  endTime?: string; // e.g. "11:30"
  title: string;
  category: PlaceCategory;
  locationName: string;
  address?: string;
  coords: Coordinates;
  cost?: number;
  currency?: string;
  navigateUrl?: string;
  referenceUrls?: string[]; // Deprecated, use referenceLinks
  referenceLinks?: { label: string; url: string }[];
  notes?: string;
  transportToNext?: {
    mode: 'walk' | 'subway' | 'bus' | 'taxi' | 'bullet_train' | 'car';
    durationMinutes: number;
    distanceText?: string;
    cost?: number;
    routes?: { label: string; url: string }[];
  };
  transportOptions?: TransportOption[];
  attachments?: string[];
  completed?: boolean;
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  themeTitle: string;
  items: ItineraryItem[];
  accommodation?: {
    name: string;
    address: string;
    coords: Coordinates;
    checkInTime?: string;
    phone?: string;
  };
  notes?: string;
}

export interface Expense {
  id: string;
  date: string;
  title: string;
  category: 'food' | 'lodging' | 'transport' | 'shopping' | 'ticket' | 'other';
  amount: number;
  originalCurrency: string;
  convertedAmount: number; // in trip base currency
  paidBy: string; // user name or ID
  splitWith: string[]; // list of user names
  notes?: string;
  receiptImage?: string;
}

export interface AttractionBookmark {
  id: string;
  title: string;
  category: PlaceCategory;
  city: string;
  address: string;
  coords: Coordinates;
  rating: number;
  openingHours?: string;
  estimatedCost?: number;
  currency?: string;
  notes: string;
  imageUrl: string;
  tags: string[];
  isWishlist: boolean;
  googleMapsUrl?: string;
}

export interface FlightInfo {
  id: string;
  flightNumber: string;
  airline: string;
  departureAirport: string;
  departureCity: string;
  departureTime: string; // ISO string or format
  arrivalAirport: string;
  arrivalCity: string;
  arrivalTime: string;
  terminal?: string;
  gate?: string;
  baggageClaim?: string;
  status: 'ON_TIME' | 'DELAYED' | 'BOARDING' | 'DEPARTED' | 'LANDED' | 'CANCELLED';
  delayMinutes?: number;
  seat?: string;
  bookingRef?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'editor' | 'viewer';
  isOnline: boolean;
  color: string;
  currentViewing?: string; // e.g. "Day 2"
}

export interface ChecklistItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
}

export interface HotelInfo {
  name: string;
  address: string;
  phone: string;
  bookingRef?: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  baseCurrency: string;
  targetCurrency: string;
  totalBudget: number;
  days: DayPlan[];
  expenses: Expense[];
  attractions: AttractionBookmark[];
  flights: FlightInfo[];
  collaborators: Collaborator[];
  shareCode: string;
  offlineReady: boolean;
  notes?: string;
  checklist?: ChecklistItem[];
  firstNightHotel?: HotelInfo;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToBaseTWD: number; // 1 TWD = X Foreign Currency
}
