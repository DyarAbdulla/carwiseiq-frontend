"use client"


export const runtime = 'edge';
import { SellDraftProvider } from '@/context/SellDraftContext'

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <SellDraftProvider>{children}</SellDraftProvider>
}
