import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PWARegister from '@/components/PWARegister'
import InstallPrompt from '@/components/InstallPrompt'
import { ThemeProvider } from '@/context/ThemeContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'),
  title: 'CarWiseIQ - AI-Powered Car Pricing',
  description: 'AI-powered car pricing with advanced machine learning',
  manifest: '/manifest.json',
  applicationName: 'CarWiseIQ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CarWiseIQ',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 dark:text-slate-50 antialiased`} suppressHydrationWarning>
        {/* Android PWA meta tag - added via script to avoid hydration issues */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof document !== 'undefined') {
                const existing = document.querySelector('meta[name="mobile-web-app-capable"]');
                if (!existing) {
                  const meta = document.createElement('meta');
                  meta.name = 'mobile-web-app-capable';
                  meta.content = 'yes';
                  document.head.appendChild(meta);
                }
              }
            `,
          }}
        />
        <ThemeProvider>
          <PWARegister />
          <InstallPrompt />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

