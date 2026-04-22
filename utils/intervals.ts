import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { decrypt } from './crypto'

export async function getUserIntervalsCredentials(userId?: string) {
  let finalUserId = userId;
  let supabase;

  if (!finalUserId) {
    const cookieStore = await cookies()
    supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    finalUserId = user.id
  } else {
    // When userId is provided (e.g. background sync), we use the admin/server client behavior
    // We already have a client helper in sync.ts, but let's make this generic
    const { createClient: createSupbaseClient } = await import('@supabase/supabase-js')
    supabase = createSupbaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('intervals_athlete_id, intervals_api_key')
    .eq('id', finalUserId)
    .single()

  if (error || !data) {
    throw new Error('Intervals.icu configuration missing. Please check your Settings.')
  }

  if (!data.intervals_athlete_id || !data.intervals_api_key) {
    throw new Error('Intervals.icu credentials incomplete. Please check your Settings.')
  }

  const apiKey = decrypt(data.intervals_api_key)
  if (!apiKey) {
    throw new Error('Failed to decrypt API Key. Please re-configure in Settings.')
  }

  return {
    athleteId: data.intervals_athlete_id,
    apiKey: apiKey,
  }
}

export function getIntervalsAuthHeader(apiKey: string): string {
  const encoded = Buffer.from(`API_KEY:${apiKey}`).toString('base64')
  return `Basic ${encoded}`
}
