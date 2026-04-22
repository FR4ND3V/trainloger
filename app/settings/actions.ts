'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { encrypt, decrypt } from '@/utils/crypto'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('intervals_athlete_id, intervals_api_key, calendar_ics_url')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is code for 'no rows returned'
    console.error('Error fetching settings:', error)
    return null
  }

  if (data?.intervals_api_key) {
    data.intervals_api_key = decrypt(data.intervals_api_key)
  }

  return data
}

export async function updateSettings(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const athleteId = formData.get('athlete_id') as string
  const apiKey = formData.get('api_key') as string
  const calendarIcsUrl = formData.get('calendar_ics_url') as string

  const encryptedApiKey = apiKey ? encrypt(apiKey) : null

  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      intervals_athlete_id: athleteId,
      intervals_api_key: encryptedApiKey,
      calendar_ics_url: calendarIcsUrl,
    })

  if (error) {
    console.error('Error updating settings:', error)
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function testConnection(athleteId: string, apiKey: string) {
  if (!athleteId || !apiKey) {
    return { error: 'Please provide both Athlete ID and API Key' }
  }

  const authHeader = `Basic ${Buffer.from(`API_KEY:${apiKey}`).toString('base64')}`

  try {
    const res = await fetch(`https://intervals.icu/api/v1/athlete/${athleteId}`, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    })

    if (res.ok) {
      return { success: true }
    }

    if (res.status === 401) {
      return { error: 'API Key invalid (401 Unauthorized)' }
    }

    if (res.status === 404) {
      return { error: 'Athlete ID not found (404 Not Found)' }
    }

    return { error: `Connection failed with status ${res.status}` }
  } catch (err) {
    console.error('Connection test error:', err)
    return { error: 'Network error. Please try again.' }
  }
}

import { syncUserData } from '@/utils/sync'

export async function triggerManualSync(isFull: boolean = false) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }
  }

  try {
    const days = isFull ? 3650 : 90
    await syncUserData(user.id, days)
    
    // Force revalidation of all pages that consume this data
    revalidatePath('/') 
    revalidatePath('/trends')
    revalidatePath('/calendar')
    
    return { success: true }
  } catch (err: any) {
    console.error('Manual sync failed:', err)
    return { error: err.message || 'Sync failed' }
  }
}
