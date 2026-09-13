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

export interface EventDetails {
  startDateTime: string;
  endDateTime?: string | null;
  isRecurring?: boolean;
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
  createdAt: string;
  updatedAt: string;
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

