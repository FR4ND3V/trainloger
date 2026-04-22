import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { getIntervalsAuthHeader, getUserIntervalsCredentials } from './intervals'

const INTERVALS_BASE = "https://intervals.icu/api/v1"

export async function syncUserData(userId: string, isFullSync: boolean = false) {
  const supabase = await createAdminClient()
  
  // 1. Get credentials
  const { data: profile, error: profileErr } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (profileErr || !profile) {
    throw new Error(`Profile not found for user ${userId}`)
  }

  const athleteId = profile.intervals_athlete_id
  const { apiKey } = await getUserIntervalsCredentials(userId)
  const authHeader = getIntervalsAuthHeader(apiKey)

  const now = new Date()
  const daysBack = isFullSync ? 3650 : 90 // 10 years or 90 days
  const oldest = new Date(now)
  oldest.setDate(now.getDate() - daysBack)
  
  const oldestStr = oldest.toISOString().split('T')[0]
  const newestStr = now.toISOString().split('T')[0]

  console.log(`Syncing ${isFullSync ? 'FULL HISTORY' : 'STANDARD'} data for user ${userId} from ${oldestStr} to ${newestStr}`)

  // 2. Fetch & Save Wellness
  try {
    const wellnessRes = await fetch(`${INTERVALS_BASE}/athlete/${athleteId}/wellness?oldest=${oldestStr}&newest=${newestStr}`, {
      headers: { 'Authorization': authHeader },
      cache: 'no-store'
    })
    
    if (wellnessRes.ok) {
      const wellnessData = await wellnessRes.json()
      if (Array.isArray(wellnessData)) {
        const formattedWellness = wellnessData.map((w: any) => ({
          user_id: userId,
          date: w.id,
          ctl: w.ctl,
          atl: w.atl,
          tsb: w.tsb,
          hrv: w.hrv,
          hrv_score: w.hrv_score,
          resting_hr: w.resting_hr,
          sleep_secs: w.sleep_secs,
          sleep_quality: w.sleep_quality,
          weight: w.weight,
          body_fat: w.body_fat,
          readiness: w.readiness,
          raw_data: w
        }))
        
        const { error: upsertErr } = await supabase
          .from('wellness')
          .upsert(formattedWellness, { onConflict: 'user_id,date' })
          
        if (upsertErr) console.error('Wellness upsert error:', upsertErr)
      }
    }
  } catch (err) {
    console.error('Wellness sync failed:', err)
  }

  // 3. Fetch & Save Activities
  try {
    const activitiesRes = await fetch(`${INTERVALS_BASE}/athlete/${athleteId}/activities?oldest=${oldestStr}&newest=${newestStr}`, {
      headers: { 'Authorization': authHeader },
      cache: 'no-store'
    })
    
    if (activitiesRes.ok) {
      const activitiesData = await activitiesRes.json()
      if (Array.isArray(activitiesData)) {
        const formattedActivities = activitiesData.map((a: any) => ({
          id: String(a.id),
          user_id: userId,
          name: a.name,
          sport_type: a.type,
          start_date: a.start_date,
          start_date_local: a.start_date_local,
          distance: a.distance,
          moving_time: a.moving_time,
          elapsed_time: a.elapsed_time,
          average_heartrate: a.average_heartrate,
          max_heartrate: a.max_heartrate,
          training_load: a.training_load,
          tss: a.tss,
          average_watts: a.average_watts,
          weighted_average_watts: a.weighted_average_watts,
          swolf: a.swolf,
          calories: a.calories,
          raw_data: a
        }))
        
        await supabase
          .from('activities')
          .upsert(formattedActivities, { onConflict: 'id,user_id' })
      }
    }
  } catch (err) {
    console.error('Activities sync failed:', err)
  }

  // 4. Fetch & Save Planned Events
  try {
    const eventsRes = await fetch(`${INTERVALS_BASE}/athlete/${athleteId}/events?oldest=${oldestStr}&newest=${newestStr}`, {
      headers: { 'Authorization': authHeader },
      cache: 'no-store'
    })
    
    if (eventsRes.ok) {
      const eventsData = await eventsRes.json()
      if (Array.isArray(eventsData)) {
        const formattedEvents = eventsData.map((ev: any) => ({
          id: String(ev.id),
          user_id: userId,
          title: ev.name || ev.type || "Training",
          category: ev.category,
          type: ev.type,
          start_date: ev.start_date_local || ev.start_date,
          end_date: ev.end_date_local || ev.end_date || ev.start_date_local || ev.start_date,
          description: ev.description,
          distance: ev.distance,
          moving_time: ev.moving_time,
          raw_data: ev
        }))
        
        await supabase
          .from('events')
          .upsert(formattedEvents, { onConflict: 'id,user_id' })
      }
    }
  } catch (err) {
    console.error('Events sync failed:', err)
  }

  return { success: true }
}

async function createAdminClient() {
  // In a real app, use SUPABASE_SERVICE_ROLE_KEY to bypass RLS for sync
  // For now, we'll use the environment variables
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
