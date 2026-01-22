import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { APIStatusBanner } from '@/components/APIStatusBanner';
import { ToastProvider } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CookieConsent } from '@/components/common/CookieConsent';
import { SkipToContent } from '@/components/common/SkipToContent';
import { SetDirection } from '@/components/common/SetDirection';
import React from 'react';

export const runtime = 'edge';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  let locale: string = 'en';
  let messages: any = {};

  try {
    const resolvedParams = await params;
    locale = resolvedParams?.locale || 'en';

    // Validate locale
    if (!locale || !locales.includes(locale as any)) {
      console.warn(`Invalid locale: ${locale}, falling back to 'en'`);
      locale = 'en';
    }

    // Enable static rendering
    try {
      unstable_setRequestLocale(locale);
    } catch (error) {
      console.error('Failed to set request locale:', error);
    }

    // Get messages with error handling
    try {
      messages = await getMessages() || {};
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Fallback to empty messages object
      messages = {};
    }
  } catch (error) {
    console.error('Error in LocaleLayout:', error);
    // Don't call notFound() here, just use defaults
    locale = 'en';
    messages = {};
  }

  return (
    <ErrorBoundary>
      <NextIntlClientProvider locale={locale} messages={messages || {}}>
        <SetDirection />
        <ToastProvider>
          <SkipToContent />
          <APIStatusBanner />
          <ErrorBoundary>
            <Header />
          </ErrorBoundary>
          <main id="main-content" className="min-h-[calc(100vh-8rem)]" role="main">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <ErrorBoundary>
            <Footer />
          </ErrorBoundary>
          <CookieConsent />
        </ToastProvider>
      </NextIntlClientProvider>
    </ErrorBoundary>
  );
}
