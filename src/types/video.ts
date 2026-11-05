export type VideoAspectRatio = '9:16' | '16:9';

export interface VideoEventItem {
  id: string;
  title: string;
  category: string;
  venue: string;
  dateStr: string;
  dateBadge: string;
  location: string;
  neighborhood: string;
  tagline: string;
  imageUrl: string;
  price: string;
  badge: string;
  accentColor: string;
}

export interface ScriptScene {
  id: string | number;
  sceneNumber: number;
  title: string;
  startSec: number;
  durationSec: number;
  voiceoverScript: string;
}

export const TOTAL_VIDEO_DURATION_SEC = 60;

export const DEFAULT_SCRIPT_SCENES: ScriptScene[] = [
  {
    id: 's1',
    sceneNumber: 1,
    title: 'The Hook',
    startSec: 0,
    durationSec: 8,
    voiceoverScript: 'What are you doing this weekend in Abeokuta? Do not stay at home!',
  },
  {
    id: 's2',
    sceneNumber: 2,
    title: 'Meet CityBuzz',
    startSec: 8,
    durationSec: 9,
    voiceoverScript: 'Meet CityBuzz - your definitive guide to events, dining, and weekend nightlife.',
  },
  {
    id: 's3',
    sceneNumber: 3,
    title: 'Culture & Hangouts',
    startSec: 17,
    durationSec: 9,
    voiceoverScript: 'From Olumo Sunrise Fiesta to rooftop dining, experience the best vibes.',
  },
  {
    id: 's4',
    sceneNumber: 4,
    title: 'Tech & Networking',
    startSec: 26,
    durationSec: 9,
    voiceoverScript: 'Connect with creators and entrepreneurs at Ogun Tech Summit.',
  },
  {
    id: 's5',
    sceneNumber: 5,
    title: 'Nightlife & Comedy',
    startSec: 35,
    durationSec: 9,
    voiceoverScript: 'Unwind with world-class comedy, live music, and verified hangouts.',
  },
  {
    id: 's6',
    sceneNumber: 6,
    title: 'Organizers & Tickets',
    startSec: 44,
    durationSec: 8,
    voiceoverScript: 'Organizers: list your events, sell Paystack tickets, and scan attendees with QR codes.',
  },
  {
    id: 's7',
    sceneNumber: 7,
    title: 'Outro CTA',
    startSec: 52,
    durationSec: 8,
    voiceoverScript: 'Visit CityBuzz.live today and never miss an event again!',
  },
];

export const DEFAULT_STUDIO_EVENTS: VideoEventItem[] = [
  {
    id: 'ev-1',
    title: 'Olumo Sunset Cultural Fiesta',
    category: 'Culture & Music',
    venue: 'Olumo Rock Heritage Complex',
    dateStr: 'This Saturday, 5:00 PM',
    dateBadge: 'SAT 5PM',
    location: 'Ikija, Abeokuta',
    neighborhood: 'Ikija',
    tagline: 'Experience the magic of Olumo under the stars',
    imageUrl: '/events/olumo_fiesta.jpg',
    price: '₦2,500',
    badge: 'Trending',
    accentColor: '#FF5A36',
  },
  {
    id: 'ev-2',
    title: 'Ogun Tech & Startup Summit',
    category: 'Technology',
    venue: 'Cultural Centre, Kuto',
    dateStr: 'This Friday, 10:00 AM',
    dateBadge: 'FRI 10AM',
    location: 'Kuto, Abeokuta',
    neighborhood: 'Kuto',
    tagline: 'Building the next generation of Nigerian founders',
    imageUrl: '/events/tech_summit.jpg',
    price: 'Free with RSVP',
    badge: 'Featured',
    accentColor: '#06B6D4',
  },
  {
    id: 'ev-3',
    title: 'Night of 1000 Laughs & Afrobeat',
    category: 'Comedy & Nightlife',
    venue: 'Continental Arena, Ibara',
    dateStr: 'Sunday Night, 7:00 PM',
    dateBadge: 'SUN 7PM',
    location: 'Ibara, Abeokuta',
    neighborhood: 'Ibara',
    tagline: 'A night of pure laughter and high-energy Afrobeat',
    imageUrl: '/events/comedy_night.jpg',
    price: '₦5,000',
    badge: 'VIP Tables Available',
    accentColor: '#A855F7',
  },
];
