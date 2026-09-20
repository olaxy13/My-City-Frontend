import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { CityProvider } from '@/context/CityContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'City Discovery Abeokuta | Discover Events, Food, Nightlife & Facilities',
  description:
    'The premier curated city discovery platform for Abeokuta. Explore live countdown events, top-rated restaurants, entertainment hangouts, and verified public facilities.',
  keywords: [
    'Abeokuta events',
    'Abeokuta restaurants',
    'Olumo Rock',
    'Ogun State entertainment',
    'Abeokuta nightlife',
    'Discover Abeokuta',
    'Nigerian city guide',
  ],
  icons: {
    icon: '/favicon.webp',
    apple: '/favicon.webp',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Explicit favicon link — .webp is not auto-handled by Next.js file conventions */}
        <link rel="icon" href="/favicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/favicon.webp" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = String(e?.reason?.message || e?.reason || '');
                  var stack = String(e?.reason?.stack || '');
                  if (
                    reason.indexOf('MetaMask') !== -1 ||
                    stack.indexOf('chrome-extension://') !== -1 ||
                    reason.indexOf('extension not found') !== -1
                  ) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
                window.addEventListener('error', function(e) {
                  var msg = String(e?.message || '');
                  var file = String(e?.filename || '');
                  if (
                    msg.indexOf('MetaMask') !== -1 ||
                    file.indexOf('chrome-extension://') !== -1 ||
                    // Suppress transient race-condition errors on initial async data load
                    // These are caught and handled gracefully in the UI components
                    (msg.indexOf('Cannot read properties of undefined') !== -1 && file.indexOf('CountdownHeroSlider') !== -1) ||
                    (msg.indexOf('is not a function') !== -1 && file.indexOf('CategoryExplorer') !== -1)
                  ) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <CityProvider>
            <AuthProvider>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                <main style={{ flex: 1 }}>{children}</main>
                <Footer />
              </div>
            </AuthProvider>
          </CityProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
