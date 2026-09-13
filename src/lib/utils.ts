import { CategorySlug } from '@/types/api';

/**
 * Generate standard Nigerian / International WhatsApp chat link
 */
export function getWhatsAppLink(phone?: string | null, listingTitle: string = 'this listing'): string {
  if (!phone) return '#';
  const cleaned = phone.replace(/[^0-9]/g, '');
  const formattedPhone = cleaned.startsWith('0') ? `234${cleaned.slice(1)}` : cleaned;
  const message = encodeURIComponent(`Hello! I saw "${listingTitle}" on City Discovery and would like to make an inquiry.`);
  return `https://wa.me/${formattedPhone}?text=${message}`;
}

/**
 * Generate Google Maps navigation link with GPS or address/neighborhood fallback
 */
export function getDirectionsLink(
  latitude?: number | null,
  longitude?: number | null,
  address?: string | null,
  neighborhood?: string | null,
  city: string = 'Abeokuta'
): string {
  if (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  const queryParts = [address, neighborhood, city, 'Nigeria'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts)}`;
}

/**
 * Generate Google Calendar Add-to-Calendar URL
 */
export function getGoogleCalendarUrl(
  title: string,
  description: string,
  startDateTime: string,
  endDateTime?: string | null,
  location?: string | null
): string {
  const start = new Date(startDateTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const end = endDateTime
    ? new Date(endDateTime).toISOString().replace(/-|:|\.\d\d\d/g, '')
    : new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${start}/${end}`,
    details: description || '',
    location: location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Live / 365 Web Calendar URL
 */
export function getOutlookCalendarUrl(
  title: string,
  description: string,
  startDateTime: string,
  endDateTime?: string | null,
  location?: string | null
): string {
  const start = new Date(startDateTime).toISOString();
  const end = endDateTime
    ? new Date(endDateTime).toISOString()
    : new Date(new Date(startDateTime).getTime() + 2 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description || '',
    location: location || '',
    startdt: start,
    enddt: end,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate standard RFC 5545 iCalendar (.ics) format string
 */
export function generateIcsContent(
  title: string,
  description: string,
  startDateTime: string,
  endDateTime?: string | null,
  location?: string | null
): string {
  const formatIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const startDate = new Date(startDateTime);
  const endDate = endDateTime
    ? new Date(endDateTime)
    : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const startFormatted = formatIcsDate(startDate);
  const endFormatted = formatIcsDate(endDate);
  const nowFormatted = formatIcsDate(new Date());
  const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@citydiscovery.com`;

  const cleanDescription = (description || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n');

  const cleanTitle = (title || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

  const cleanLocation = (location || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//City Discovery Platform//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Trigger download of .ics file directly in user's browser (no account needed!)
 */
export function downloadIcsFile(
  title: string,
  description: string,
  startDateTime: string,
  endDateTime?: string | null,
  location?: string | null
): void {
  if (typeof window === 'undefined') return;
  const ics = generateIcsContent(title, description, startDateTime, endDateTime, location);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event'}.ics`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format relative countdown time
 */
export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSecondsRemaining: number;
}

export function calculateCountdown(targetDateStr: string): CountdownTime {
  const target = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalSecondsRemaining: 0 };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
    totalSecondsRemaining: Math.floor(diff / 1000),
  };
}

/**
 * Human readable date formatter
 */
export function formatEventDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatEventTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-NG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '';
  }
}

/**
 * Category styling metadata & badge labels
 */
export const CATEGORY_CONFIG: Record<
  CategorySlug,
  { label: string; iconName: string; color: string; bgGradient: string; glowColor: string }
> = {
  music: {
    label: 'Music & Concerts',
    iconName: 'Music',
    color: '#F43F5E',
    bgGradient: 'linear-gradient(135deg, #F43F5E, #FB7185)',
    glowColor: 'rgba(244, 63, 94, 0.4)',
  },
  food_drink: {
    label: 'Food & Dining',
    iconName: 'Utensils',
    color: '#F97316',
    bgGradient: 'linear-gradient(135deg, #F97316, #FBBF24)',
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  sports: {
    label: 'Sports & Fitness',
    iconName: 'Trophy',
    color: '#10B981',
    bgGradient: 'linear-gradient(135deg, #10B981, #34D399)',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  comedy: {
    label: 'Comedy & Laughs',
    iconName: 'Sparkles',
    color: '#EAB308',
    bgGradient: 'linear-gradient(135deg, #EAB308, #FDE047)',
    glowColor: 'rgba(234, 179, 8, 0.4)',
  },
  arts_culture: {
    label: 'Arts & Culture',
    iconName: 'Palette',
    color: '#8B5CF6',
    bgGradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  nightlife: {
    label: 'Nightlife & Bars',
    iconName: 'Wine',
    color: '#EC4899',
    bgGradient: 'linear-gradient(135deg, #EC4899, #F472B6)',
    glowColor: 'rgba(236, 72, 153, 0.4)',
  },
  religious: {
    label: 'Faith & Worship',
    iconName: 'Sun',
    color: '#3B82F6',
    bgGradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    glowColor: 'rgba(59, 130, 246, 0.4)',
  },
  education: {
    label: 'Tech & Learning',
    iconName: 'GraduationCap',
    color: '#06B6D4',
    bgGradient: 'linear-gradient(135deg, #06B6D4, #38BDF8)',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  lifestyle: {
    label: 'Parks & Lifestyle',
    iconName: 'Compass',
    color: '#14B8A6',
    bgGradient: 'linear-gradient(135deg, #14B8A6, #2DD4BF)',
    glowColor: 'rgba(20, 184, 166, 0.4)',
  },
  wellness: {
    label: 'Health & Wellness',
    iconName: 'HeartPulse',
    color: '#6366F1',
    bgGradient: 'linear-gradient(135deg, #6366F1, #818CF8)',
    glowColor: 'rgba(99, 102, 241, 0.4)',
  },
};

export const ABEKOULA_NEIGHBORHOODS = [
  'Ibara',
  'Oke-Mosan',
  'Kuto',
  'Panseke',
  'Ikija',
  'Idi-Aba',
  'Ake',
  'Camp/FUNAAB',
  'Adigbe',
  'Obantoko',
  'Totoro',
  'Lafenwa',
  'Sapon',
];

/**
 * Reads a File and produces an optimized Base64 Data URL.
 * Resizes large images to max 1200px dimension and compresses to ~80% quality
 * to keep payload reasonable when Cloudinary is in fallback mode.
 */
export function readAndCompressImage(file: File, maxDim = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      // Document (e.g. PDF)
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = (e.target?.result as string) || '';
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

