"use client"

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function splitItems(items: string): string[] {
  return (items || '').split('|').map((s) => s.trim()).filter(Boolean)
}

const CONTACT_LINKS: [string, string][] = [
  ['carwise15@gmail.com', 'mailto:carwise15@gmail.com'],
  ['0777 447 2106', 'tel:+9647774472106'],
  ['0770 450 1030', 'tel:+9647704501030'],
]

function renderItemWithLinks(text: string) {
  for (const [pattern, href] of CONTACT_LINKS) {
    if (text.includes(pattern)) {
      const [before, ...rest] = text.split(pattern)
      const after = rest.join(pattern)
      return (
        <>
          {before}
          <a href={href} className="text-[#94a3b8] hover:underline focus:outline-none focus:underline">
            {pattern}
          </a>
          {after}
        </>
      )
    }
  }
  return text
}

function renderParagraphs(text: string, className: string) {
  const paragraphs = (text || '').split(/\n\n+/).filter(Boolean)
  if (paragraphs.length <= 1) return <p className={className}>{text || ''}</p>
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className={className}>{p}</p>
      ))}
    </div>
  )
}

function Callout({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'notice' }) {
  const border = variant === 'notice' ? 'border-l-amber-500/60' : 'border-l-sky-500/60'
  const text = typeof children === 'string' ? children : String(children)
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  return (
    <div className={`border-l-4 ${border} bg-[#252836]/80 rounded-r-lg p-4 my-4`}>
      <div className="text-[#94a3b8] leading-loose space-y-3">
        {paragraphs.map((p, i) => <p key={i} className="m-0">{p}</p>)}
      </div>
    </div>
  )
}

type Section = {
  key: string
  hasItems?: boolean
  hasFooter?: boolean
  hasDescription?: boolean
  calloutFooter?: boolean
  calloutContent?: boolean
  isContact?: boolean
}

const bodyClass = 'text-[#94a3b8] leading-loose'
const listClass = 'list-disc list-inside text-[#94a3b8] leading-loose space-y-2.5 ml-4 rtl:ml-0 rtl:mr-4'

export default function TermsPage() {
  const locale = useLocale()
  const t = useTranslations('terms')
  const dateStr = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'ku' ? 'ku-IQ' : 'en-US')

  const sections: Section[] = [
    { key: 'acceptance', hasItems: false },
    { key: 'descriptionOfService', hasItems: true, hasFooter: true, calloutFooter: true },
    { key: 'eligibility', hasItems: false },
    { key: 'accountRegistration', hasItems: true, hasFooter: true, hasDescription: false },
    { key: 'pricePredictionsDisclaimer', hasItems: false, calloutContent: true },
    { key: 'userContent', hasItems: true, hasFooter: true },
    { key: 'prohibitedUses', hasItems: true },
    { key: 'termination', hasItems: true, hasFooter: true },
    { key: 'intellectualProperty', hasItems: false },
    { key: 'disclaimerOfWarranties', hasItems: false, calloutContent: true },
    { key: 'limitationOfLiability', hasItems: false },
    { key: 'governingLaw', hasItems: false },
    { key: 'changesToTerms', hasItems: false },
    { key: 'contactInformation', hasItems: true, isContact: true },
  ]

  return (
    <div className="min-h-[calc(100vh-200px)] p-6 md:p-8 bg-[#0f1117]" dir={locale === 'ar' || locale === 'ku' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <Card className="border-[#2a2d3a] bg-[#1a1d29] text-white overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl font-semibold">{t('title')}</CardTitle>
            <p className="text-[#94a3b8] text-sm mt-1">{t('lastUpdated', { date: dateStr })}</p>
          </CardHeader>
          <CardContent className="px-6 pb-8 md:px-8 md:pb-10">
            {t('intro') && (
              <p className={`${bodyClass} mb-8 max-w-3xl`}>{t('intro')}</p>
            )}
            <div className="space-y-8">
              {sections.map((s) => {
                const { key, hasItems, hasFooter, hasDescription = true, calloutFooter, calloutContent, isContact } = s
                const base = `sections.${key}` as const
                const sectionCardClass = [
                  'rounded-xl border border-[#2a2d3a] bg-[#1e2130]/90 p-5 md:p-6',
                  isContact && 'border-l-4 border-l-sky-500/50',
                ].filter(Boolean).join(' ')

                return (
                  <section key={key} className={sectionCardClass}>
                    <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">{t(`${base}.title`)}</h2>
                    <div className="max-w-3xl space-y-4">
                      {hasItems ? (
                        <>
                          {hasDescription && (
                            <p className={`${bodyClass} mb-2`}>{t(`${base}.description`)}</p>
                          )}
                          <ul className={listClass}>
                            {splitItems(t(`${base}.items`)).map((text, i) => (
                              <li key={i}>{key === 'contactInformation' ? renderItemWithLinks(text) : text}</li>
                            ))}
                          </ul>
                          {hasFooter && !calloutFooter && (
                            <div className="mt-4">{renderParagraphs(t(`${base}.footer`), bodyClass)}</div>
                          )}
                          {hasFooter && calloutFooter && (
                            <Callout variant="info">{t(`${base}.footer`)}</Callout>
                          )}
                        </>
                      ) : (
                        calloutContent ? (
                          <Callout variant="notice">{t(`${base}.content`)}</Callout>
                        ) : (
                          renderParagraphs(t(`${base}.content`), bodyClass)
                        )
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
