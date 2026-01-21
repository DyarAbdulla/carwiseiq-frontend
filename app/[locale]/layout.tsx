import { NextIntlClientProvider } from 'next-intl';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { APIStatusBanner } from '@/components/APIStatusBanner';
import { ToastProvider } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CookieConsent } from '@/components/common/CookieConsent';
import { SkipToContent } from '@/components/common/SkipToContent';
import { SetDirection } from '@/components/common/SetDirection';
import { ScrollToTop } from '@/components/ScrollToTop';
import { PageTransition } from '@/components/PageTransition';
import { PredictLoadingProvider } from '@/components/PredictLoadingProvider';
import { CsrfProvider } from '@/context/CsrfContext';
import { RecoveryHashRedirect } from '@/components/auth/RecoveryHashRedirect';
import React from 'react';

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
      <NextIntlClientProvider key={locale} locale={locale} messages={messages || {}}>
        <SetDirection />
        <CsrfProvider>
        <ToastProvider>
          <RecoveryHashRedirect />
          <PredictLoadingProvider>
            <ScrollToTop />
            <SkipToContent />
            <APIStatusBanner />
            <div className="flex flex-col min-h-screen">
              <ErrorBoundary>
                <Header />
              </ErrorBoundary>
              <main id="main-content" className="relative flex-1 min-h-[calc(100vh-8rem)]" role="main">
                <div className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 pt-20 pb-24 sm:pb-28 overflow-visible">
                  <ErrorBoundary homeHref={`/${locale}`}>
                    <PageTransition>
                      {children}
                    </PageTransition>
                  </ErrorBoundary>
                </div>
              </main>
              <ErrorBoundary>
                <Footer />
              </ErrorBoundary>
            </div>
            <CookieConsent />
          </PredictLoadingProvider>
        </ToastProvider>
        </CsrfProvider>
      </NextIntlClientProvider>
    </ErrorBoundary>
  );
}
