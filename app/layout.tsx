import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import PWARegister from '@/components/PWARegister'
import InstallPrompt from '@/components/InstallPrompt'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Car Price Predictor Pro',
  description: 'AI-powered car price prediction with advanced machine learning',
  manifest: '/manifest.json',
  applicationName: 'Car Price Predictor Pro',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CarPrice',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[#0f1117] text-white`} suppressHydrationWarning>
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
        <PWARegister />
        <InstallPrompt />
        {children}
      </body>
    </html>
  )
}

