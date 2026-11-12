import type {
  CreateSubmissionInput,
  CreateSubmissionPayload,
  CreateTicketTierInput,
  ListingType,
} from '@/types/api';

export const DEFAULT_CITY = 'Abeokuta';
export const MAX_GALLERY_PHOTOS = 10;
export const MIN_DESCRIPTION_LENGTH = 20;
export const ACCOUNT_NUMBER_LENGTH = 10;

export const DANGER = '#EF4444';

export type FormUpdater = <K extends keyof CreateSubmissionInput>(
  field: K,
  value: CreateSubmissionInput[K]
) => void;

export const emptyTier = (name = ''): CreateTicketTierInput => ({
  name,
  price: '',
  totalCapacity: '',
  description: '',
});

export function createEmptyForm(city: string, neighborhood = ''): CreateSubmissionInput {
  return {
    listingType: 'event',
    title: '',
    description: '',
    category: 'music',
    city,
    neighborhood,
    address: '',
    latitude: undefined,
    longitude: undefined,
    thumbnailUrl: '',
    galleryImageUrls: [],
    legalDocumentUrls: [],
    contactPhone: '',
    contactEmail: '',
    externalLink: '',
    submitterName: '',
    submitterEmail: '',
    submitterPhone: '',
    // Event
    startDateTime: '',
    endDateTime: '',
    isRecurring: false,
    // Restaurant
    cuisineType: '',
    priceRange: '$$',
    operatingHours: '',
    menuLink: '',
    cacNumber: '',
    licenseNumber: '',
    // Facility
    facilityCategory: '',
    emergencyContact: '',
    // Event ticketing & payouts
    ticketTiers: [emptyTier('Regular')],
    payoutBankCode: '',
    payoutAccountNumber: '',
    payoutAccountName: '',
  };
}

/* ---------------------------------- Steps --------------------------------- */

export type StepKey = 'general' | 'photos' | 'details' | 'tickets' | 'legal' | 'submitter';

export interface StepDef {
  key: StepKey;
  label: string;
}

/** Events get an extra "Tickets" step between details and legal. */
export function getSteps(listingType: ListingType): StepDef[] {
  return [
    { key: 'general', label: 'General' },
    { key: 'photos', label: 'Photos' },
    { key: 'details', label: 'Details' },
    ...(listingType === 'event' ? [{ key: 'tickets' as const, label: 'Tickets' }] : []),
    { key: 'legal', label: 'Legal CAC' },
    { key: 'submitter', label: 'Submitter' },
  ];
}

export const requiresLegalDocs = (type: ListingType) => type === 'restaurant' || type === 'facility';

const hasPaidTier = (tiers: CreateTicketTierInput[]) =>
  tiers.some((t) => t.price !== '' && Number(t.price) > 0);

/* ------------------------------- Validation ------------------------------- */

/** Returns an error message for the given step, or null when it is valid. */
export function validateStep(key: StepKey, form: CreateSubmissionInput): string | null {
  switch (key) {
    case 'general':
      if (!form.title.trim()) return 'Please enter a listing title.';
      if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
        return `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`;
      }
      if (!form.neighborhood) return 'Please select a neighborhood.';
      return null;

    case 'photos':
      return form.thumbnailUrl ? null : 'Please upload a cover thumbnail image.';

    case 'details':
      if (form.listingType === 'event' && !form.startDateTime) {
        return 'Please specify the event start date and time.';
      }
      if (form.listingType === 'restaurant' && !form.cuisineType?.trim()) {
        return 'Please enter the cuisine or food type (e.g. Authentic Yoruba, Grills).';
      }
      if (form.listingType === 'facility' && !form.facilityCategory?.trim()) {
        return 'Please enter the facility type (e.g. Tertiary Hospital, Tech Hub).';
      }
      return null;

    case 'tickets': {
      const tiers = form.ticketTiers || [];
      if (tiers.length === 0) return 'Please add at least one ticket tier for your event.';

      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        if (!tier.name.trim()) return `Ticket tier #${i + 1} needs a name (e.g. "Regular", "VIP").`;

        const price = tier.price === '' ? 0 : Number(tier.price);
        if (isNaN(price) || price < 0) return `Ticket tier "${tier.name}" price cannot be negative.`;

        const capacity = Number(tier.totalCapacity);
        if (tier.totalCapacity === '' || isNaN(capacity) || capacity < 1) {
          return `Ticket tier "${tier.name}" must have a valid capacity number of at least 1.`;
        }
      }

      if (hasPaidTier(tiers)) {
        if (!form.payoutBankCode?.trim()) return 'Please select your bank for payout settlements.';
        if (form.payoutAccountNumber?.trim().length !== ACCOUNT_NUMBER_LENGTH) {
          return 'Please enter a valid 10-digit bank account number.';
        }
        if (!form.payoutAccountName?.trim()) {
          return 'Please wait for your account name to be verified before proceeding.';
        }
      }
      return null;
    }

    case 'legal':
      if (requiresLegalDocs(form.listingType) && !form.legalDocumentUrls?.length) {
        return `Legal verification document (CAC Certificate or Operating License) is compulsory for ${form.listingType} listings.`;
      }
      return null;

    case 'submitter':
      if (!form.submitterName.trim() || !form.submitterEmail.trim() || !form.submitterPhone.trim()) {
        return 'Please fill in all submitter contact fields.';
      }
      return null;
  }
}

/** First error across every step of the form, or null when the whole form is valid. */
export function validateAll(form: CreateSubmissionInput): string | null {
  for (const { key } of getSteps(form.listingType)) {
    const error = validateStep(key, form);
    if (error) return error;
  }
  return null;
}

/* --------------------------------- Payload -------------------------------- */

const trimOrUndefined = (value?: string) => value?.trim() || undefined;

/** Maps form state to the backend DTO, sending only the fields for the chosen listing type. */
export function buildPayload(form: CreateSubmissionInput): CreateSubmissionPayload {
  const payload: CreateSubmissionPayload = {
    listingType: form.listingType,
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    city: form.city?.trim() || DEFAULT_CITY,
    neighborhood: form.neighborhood.trim(),
    address: trimOrUndefined(form.address),
    latitude: form.latitude,
    longitude: form.longitude,
    thumbnailUrl: form.thumbnailUrl,
    galleryImageUrls: (form.galleryImageUrls || []).slice(0, MAX_GALLERY_PHOTOS),
    legalDocumentUrls: form.legalDocumentUrls || [],
    contactPhone: trimOrUndefined(form.contactPhone),
    contactEmail: trimOrUndefined(form.contactEmail),
    externalLink: trimOrUndefined(form.externalLink),
    submitterName: form.submitterName.trim(),
    submitterEmail: form.submitterEmail.toLowerCase().trim(),
    submitterPhone: form.submitterPhone.trim(),
  };

  switch (form.listingType) {
    case 'event':
      payload.eventDetails = {
        startDateTime: new Date(form.startDateTime!).toISOString(),
        endDateTime: form.endDateTime ? new Date(form.endDateTime).toISOString() : undefined,
        isRecurring: Boolean(form.isRecurring),
      };
      if (form.ticketTiers?.length) {
        payload.ticketTiers = form.ticketTiers.map((t) => ({
          name: t.name.trim(),
          price: t.price === '' ? 0 : Number(t.price) || 0,
          totalCapacity: Number(t.totalCapacity) || 1,
          description: trimOrUndefined(t.description),
        }));
      }
      if (form.payoutBankCode?.trim()) {
        payload.payoutBankCode = form.payoutBankCode.trim();
        payload.payoutAccountNumber = form.payoutAccountNumber?.trim();
        payload.payoutAccountName = form.payoutAccountName?.trim();
      }
      break;

    case 'restaurant':
      payload.restaurantDetails = {
        cuisineType: form.cuisineType!.trim(),
        priceRange: trimOrUndefined(form.priceRange),
        operatingHours: trimOrUndefined(form.operatingHours),
        menuLink: trimOrUndefined(form.menuLink),
        cacNumber: trimOrUndefined(form.cacNumber),
        licenseNumber: trimOrUndefined(form.licenseNumber),
      };
      break;

    case 'facility':
      payload.facilityDetails = {
        facilityCategory: form.facilityCategory!.trim(),
        emergencyContact: trimOrUndefined(form.emergencyContact),
        operatingHours: trimOrUndefined(form.operatingHours),
        cacNumber: trimOrUndefined(form.cacNumber),
        licenseNumber: trimOrUndefined(form.licenseNumber),
      };
      break;
  }

  return payload;
}
