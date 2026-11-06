export type ListingType = 'event' | 'restaurant' | 'facility';
export type ListingStatus = 'pending' | 'needs_changes' | 'approved' | 'rejected';
export type AdminRole = 'admin' | 'super_admin';

export type CategorySlug =
  | 'music'
  | 'food_drink'
  | 'sports'
  | 'comedy'
  | 'arts_culture'
  | 'nightlife'
  | 'religious'
  | 'education'
  | 'lifestyle'
  | 'wellness';

export interface City {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
  listingCount?: number;
  neighborhoods?: string[];
}

export interface Category {
  slug: CategorySlug;
  name: string;
  displayOrder: number;
  listingCount: number;
}

export interface ListingImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

export interface TicketTier {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  totalCapacity: number;
  soldCount: number;
  isSoldOut?: boolean;
}

export interface EventDetails {
  startDateTime: string;
  endDateTime?: string | null;
  isRecurring?: boolean;
  payoutBankCode?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  subaccountCode?: string | null;
  commissionType?: 'PERCENTAGE' | 'FLAT_FEE';
  commissionValue?: number;
  checkInPin?: string | null;
}

export interface RestaurantDetails {
  cuisineType: string;
  priceRange?: string | null; // "$", "$$", "$$$", "$$$$"
  operatingHours?: string | null;
  menuLink?: string | null;
  cacNumber?: string | null;
  licenseNumber?: string | null;
}

export interface FacilityDetails {
  facilityCategory: string;
  emergencyContact?: string | null;
  operatingHours?: string | null;
  cacNumber?: string | null;
  licenseNumber?: string | null;
}

export interface ListingDetail {
  id: string;
  listingType: ListingType;
  title: string;
  description: string;
  category: CategorySlug;
  categoryLabel?: string;
  city: string;
  neighborhood: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  thumbnailUrl: string;
  images: ListingImage[];
  legalDocumentUrls?: string[];
  contactPhone?: string | null;
  contactEmail?: string | null;
  externalLink?: string | null;
  status: ListingStatus;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  isFeatured: boolean;
  featuredOrder?: number | null;
  isPublished: boolean;
  submitterName?: string;
  submitterEmail?: string;
  submitterPhone?: string;
  editToken?: string;
  eventDetails?: EventDetails | null;
  restaurantDetails?: RestaurantDetails | null;
  facilityDetails?: FacilityDetails | null;
  ticketTiers?: TicketTier[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendeeInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface InitializeTicketOrderInput {
  listingId: string;
  tierId: string;
  quantity: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  attendees?: AttendeeInput[];
  callbackUrl?: string;
}

export interface InitializeTicketOrderResponse {
  orderId: string;
  reference: string;
  authorizationUrl: string;
}

export interface TicketPassItem {
  ticketCode: string;
  tierName: string;
  attendeeName: string;
  attendeeEmail?: string | null;
  attendeePhone?: string | null;
  qrDataUrl?: string;
}

export interface VerifyTicketPaymentResponse {
  isSuccess: boolean;
  message: string;
  order?: {
    id: string;
    reference: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    totalAmount: number;
    status: string;
    listing?: {
      id: string;
      title: string;
      address?: string | null;
      city?: string;
      neighborhood?: string;
    };
    items?: Array<{
      quantity: number;
      tier?: {
        name: string;
        price: number;
      };
    }>;
  };
  tickets?: TicketPassItem[];
}

export interface CheckInTicketRequest {
  tokenOrCode: string;
  eventId?: string;
  pin?: string;
}

export interface CheckInTicketResponse {
  status: 'ADMITTED' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT' | 'INVALID_PIN';
  message: string;
  ticketCode?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  tierName?: string;
  eventTitle?: string;
  checkedInAt?: string | Date;
}

export interface NigerianBank {
  id: number;
  name: string;
  slug: string;
  code: string;
  active: boolean;
}

export interface UpdateCommissionPayload {
  commissionType: 'PERCENTAGE' | 'FLAT_FEE';
  commissionValue: number;
  subaccountCode?: string | null;
  checkInPin?: string | null;
}

export interface CountdownSliderItem {
  id: string;
  listingType: 'event';
  title: string;
  thumbnailUrl: string;
  city: string;
  neighborhood: string;
  category: CategorySlug;
  categoryLabel?: string;
  isFeatured: boolean;
  featuredOrder?: number | null;
  startDateTime: string;
  endDateTime?: string | null;
  description?: string;
  externalLink?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface AdminLoginResponse {
  token: string;
  user: AdminUser;
}

export interface CreateTicketTierInput {
  name: string;
  price: number | string;
  totalCapacity: number | string;
  description?: string;
}

export interface CreateSubmissionInput {
  listingType: ListingType;
  title: string;
  description: string;
  category: CategorySlug;
  city: string;
  neighborhood: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  thumbnailUrl: string;
  galleryImageUrls?: string[];
  legalDocumentUrls?: string[];
  contactPhone?: string;
  contactEmail?: string;
  externalLink?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  // Event
  startDateTime?: string;
  endDateTime?: string;
  isRecurring?: boolean;
  // Ticket Tiers (event only)
  ticketTiers?: CreateTicketTierInput[];
  // Payout Bank Details (event only)
  payoutBankCode?: string;
  payoutAccountNumber?: string;
  payoutAccountName?: string;
  // Restaurant
  cuisineType?: string;
  priceRange?: string;
  operatingHours?: string;
  menuLink?: string;
  cacNumber?: string;
  licenseNumber?: string;
  // Facility
  facilityCategory?: string;
  emergencyContact?: string;
}

export interface CreateSubmissionPayload {
  listingType: ListingType;
  title: string;
  description: string;
  category: CategorySlug;
  city?: string;
  neighborhood: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  thumbnailUrl: string;
  galleryImageUrls?: string[];
  legalDocumentUrls?: string[];
  contactPhone?: string;
  contactEmail?: string;
  externalLink?: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  eventDetails?: {
    startDateTime: string;
    endDateTime?: string | null;
    isRecurring?: boolean;
  };
  ticketTiers?: CreateTicketTierInput[];
  payoutBankCode?: string;
  payoutAccountNumber?: string;
  payoutAccountName?: string;
  restaurantDetails?: {
    cuisineType: string;
    priceRange?: string | null;
    operatingHours?: string | null;
    menuLink?: string | null;
    cacNumber?: string | null;
    licenseNumber?: string | null;
  };
  facilityDetails?: {
    facilityCategory: string;
    emergencyContact?: string | null;
    operatingHours?: string | null;
    cacNumber?: string | null;
    licenseNumber?: string | null;
  };
}

export interface ResubmitSubmissionPayload {
  title?: string;
  description?: string;
  category?: CategorySlug;
  city?: string;
  neighborhood?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  thumbnailUrl?: string;
  galleryImageUrls?: string[];
  legalDocumentUrls?: string[];
  contactPhone?: string;
  contactEmail?: string;
  externalLink?: string;
  submitterName?: string;
  submitterPhone?: string;
  eventDetails?: {
    startDateTime: string;
    endDateTime?: string | null;
    isRecurring?: boolean;
  };
  restaurantDetails?: {
    cuisineType: string;
    priceRange?: string | null;
    operatingHours?: string | null;
    menuLink?: string | null;
    cacNumber?: string | null;
    licenseNumber?: string | null;
  };
  facilityDetails?: {
    facilityCategory: string;
    emergencyContact?: string | null;
    operatingHours?: string | null;
    cacNumber?: string | null;
    licenseNumber?: string | null;
  };
}

// ─── Organizer Auth ───────────────────────────────────────────
export interface OrganizerLoginResponse {
  token: string;
  organizerEmail: string;
}

export interface OrganizerSettings {
  notificationPreference: 'per_sale' | 'daily_digest' | 'weekly_digest';
}

// ─── Organizer Event Analytics ────────────────────────────────
export interface OrganizerEventSummary {
  id: string;
  title: string;
  status: ListingStatus;
  thumbnailUrl: string;
  city: string;
  startDateTime: string | null;
  totalRevenue: number;
  platformFee: number;
  organizerPayout: number;
  totalOrders: number;
  totalTicketsSold: number;
  rejectionReason?: string | null;
}

export interface OrganizerTierStats {
  id: string;
  name: string;
  price: number;
  totalCapacity: number;
  soldCount: number;
  remaining: number;
  revenue: number;
}

export interface OrganizerEventAnalytics {
  listing: ListingDetail;
  revenue: {
    gross: number;
    platformFee: number;
    organizerPayout: number;
    totalOrders: number;
  };
  attendance: {
    totalTicketsIssued: number;
    checkedIn: number;
    checkInRate: number;
  };
  tiers: OrganizerTierStats[];
  salesByDay: { date: string; orders: number; revenue: number }[];
}

// ─── Orders & Attendees ───────────────────────────────────────
export interface OrganizerOrder {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  commission: number;
  organizerAmount: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  paidAt: string | null;
  items: { tierName: string; quantity: number; unitPrice: number; subtotal: number }[];
}

export interface OrganizerAttendee {
  ticketCode: string;
  tierName: string;
  attendeeName: string;
  attendeeEmail: string | null;
  attendeePhone: string | null;
  isUsed: boolean;
  checkedInAt: string | null;
}


