import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Car row type (matches Supabase cars table)
export type CarRow = {
  id: string
  user_id: string
  car_name: string
  car_model: string | null
  car_year: number | null
  car_price: number | null
  car_image_url: string | null
  description: string | null
  created_at: string
}

// Insert payload (user_id is set by RLS / server)
export type CarInsert = {
  car_name: string
  car_model?: string | null
  car_year?: number | null
  car_price?: number | null
  car_image_url?: string | null
  description?: string | null
}

export type CarUpdate = Partial<Omit<CarInsert, 'car_name'>> & { car_name?: string }
