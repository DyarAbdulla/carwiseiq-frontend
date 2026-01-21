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
  hasTypesLabel?: boolean
  hasDescription?: boolean
  isGroupHeader?: boolean
  isSubsection?: boolean
  calloutFooter?: boolean
  calloutContent?: boolean
  isContact?: boolean
}

const bodyClass = 'text-[#94a3b8] leading-loose'
const listClass = 'list-disc list-inside text-[#94a3b8] leading-loose space-y-2.5 ml-4 rtl:ml-0 rtl:mr-4'

export default function PrivacyPage() {
  const locale = useLocale()
  const t = useTranslations('privacy')
  const dateStr = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : locale === 'ku' ? 'ku-IQ' : 'en-US')

  const sections: Section[] = [
    { key: 'informationWeCollect', isGroupHeader: true },
    { key: 'informationYouProvide', isSubsection: true, hasItems: true, hasFooter: true, hasDescription: false, calloutFooter: true },
    { key: 'informationCollectedAutomatically', isSubsection: true, hasItems: true, hasDescription: false },
    { key: 'howWeUseInfo', hasItems: true },
    { key: 'cookies', hasItems: true, hasFooter: true },
    { key: 'informationSharing', hasItems: true },
    { key: 'dataSecurity', hasItems: false, calloutContent: true },
    { key: 'dataRetention', hasItems: true, hasDescription: false },
    { key: 'childrenAndAgeUse', hasItems: false },
    { key: 'yourRights', hasItems: true, hasFooter: true },
    { key: 'changesToPolicy', hasItems: false },
    { key: 'contactUs', hasItems: true, isContact: true },
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
                const { key, hasItems, hasFooter, hasTypesLabel, hasDescription = true, isGroupHeader, isSubsection, calloutFooter, calloutContent, isContact } = s
                const base = `sections.${key}` as const
                const Heading = isSubsection ? 'h3' : 'h2'
                const headingClass = `font-semibold text-white ${isSubsection ? 'text-xl mb-3' : 'text-xl md:text-2xl mb-4'}`

                const sectionCardClass = [
                  'rounded-xl border border-[#2a2d3a] bg-[#1e2130]/90 p-5 md:p-6',
                  isContact && 'border-l-4 border-l-sky-500/50',
                ].filter(Boolean).join(' ')

                if (isGroupHeader) {
                  return (
                    <section key={key} className={sectionCardClass}>
                      <Heading className={headingClass}>{t(`${base}.title`)}</Heading>
                    </section>
                  )
                }

                return (
                  <section key={key} className={sectionCardClass}>
                    <Heading className={headingClass}>{t(`${base}.title`)}</Heading>
                    <div className="max-w-3xl space-y-4">
                      {hasTypesLabel && (
                        <>
                          <p className={`${bodyClass} mb-2`}>{t(`${base}.description`)}</p>
                          <p className={`${bodyClass} mt-2`}>{t(`${base}.typesLabel`)}</p>
                          <ul className={listClass + ' mt-2'}>
                            {splitItems(t(`${base}.items`)).map((text, i) => (
                              <li key={i}>{text}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {!hasTypesLabel && hasItems && (
                        <>
                          {hasDescription && (
                            <p className={`${bodyClass} mb-2`}>{t(`${base}.description`)}</p>
                          )}
                          <ul className={listClass}>
                            {splitItems(t(`${base}.items`)).map((text, i) => (
                              <li key={i}>{key === 'contactUs' ? renderItemWithLinks(text) : text}</li>
                            ))}
                          </ul>
                          {hasFooter && !calloutFooter && (
                            <div className="mt-4">{renderParagraphs(t(`${base}.footer`), bodyClass)}</div>
                          )}
                          {hasFooter && calloutFooter && (
                            <Callout variant="info">{t(`${base}.footer`)}</Callout>
                          )}
                        </>
                      )}
                      {!hasTypesLabel && !hasItems && (
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
