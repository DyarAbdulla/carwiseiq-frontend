import { redirect } from 'next/navigation'
import { defaultLocale } from '@/i18n'

// Root page redirects to default locale
// This ensures / always works, even if middleware doesn't run
export default function RootPage() {
  redirect(`/${defaultLocale}`)
}
