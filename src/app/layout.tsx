import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { CITY_STORAGE_KEY, cityFromCookie } from '@/lib/city';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { CityProvider } from '@/context/CityContext';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { InlineScript } from '@/components/ui/InlineScript';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The visitor's city, so the server renders the same city the browser will show
  const initialCity = cityFromCookie((await cookies()).get(CITY_STORAGE_KEY)?.value);

  return (
    <html lang="en" suppressHydrationWarning data-theme="dark" data-scroll-behavior="smooth">
      <head>
        {/* Explicit favicon link — .webp is not auto-handled by Next.js file conventions */}
        <link rel="icon" href="/favicon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/favicon.webp" />
        {/* Apply saved theme before first paint to prevent dark→light (or light→dark) flash */}
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem('city_discovery_theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else{document.documentElement.setAttribute('data-theme','dark');}}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`}
        />
        <Script
          id="global-error-suppression"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // Intercept console.error to filter third-party wallet extension noise (MetaMask, Phantom, etc.)
                var origConsoleError = console.error;
                console.error = function() {
                  var str = '';
                  for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    if (typeof a === 'string') {
                      str += ' ' + a;
                    } else if (a && (a.message || a.stack)) {
                      str += ' ' + (a.message || '') + ' ' + (a.stack || '');
                    }
                  }
                  if (
                    str.indexOf('MetaMask') !== -1 ||
                    str.indexOf('chrome-extension://') !== -1 ||
                    str.indexOf('Failed to connect to MetaMask') !== -1
                  ) {
                    return;
                  }
                  origConsoleError.apply(console, arguments);
                };

                window.addEventListener('unhandledrejection', function(e) {
                  var reason = String(e?.reason?.message || e?.reason || '');
                  var stack = String(e?.reason?.stack || '');
                  if (
                    reason.indexOf('ChunkLoadError') !== -1 ||
                    reason.indexOf('Loading chunk') !== -1 ||
                    reason.indexOf('Failed to fetch dynamically imported module') !== -1
                  ) {
                    window.location.reload();
                    return;
                  }
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
                    msg.indexOf('ChunkLoadError') !== -1 ||
                    msg.indexOf('Loading chunk') !== -1 ||
                    msg.indexOf('Failed to fetch dynamically imported module') !== -1
                  ) {
                    window.location.reload();
                    return;
                  }
                  if (
                    msg.indexOf('MetaMask') !== -1 ||
                    file.indexOf('chrome-extension://') !== -1
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
          <CityProvider initialCity={initialCity}>
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
