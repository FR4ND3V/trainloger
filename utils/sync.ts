import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { getIntervalsAuthHeader, getUserIntervalsCredentials } from './intervals'

const INTERVALS_BASE = "https://intervals.icu/api/v1"

export async function syncUserData(userId: string, daysBack: number = 90) {
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
  const oldest = new Date(now)
  oldest.setDate(now.getDate() - daysBack)
  
  const oldestStr = oldest.toISOString().split('T')[0]
  const newestStr = now.toISOString().split('T')[0]

  console.log(`Syncing data for user ${userId} (${daysBack} days) from ${oldestStr} to ${newestStr}`)

  // 2. Fetch & Save Wellness
  // 2. Fetch & Save Wellness
  try {
    // 2a. Fetch Athlete for current CTL/ATL/TSB fallback
    const athleteRes = await fetch(`${INTERVALS_BASE}/athlete/${athleteId}`, {
      headers: { 'Authorization': authHeader },
      cache: 'no-store'
    })
    let athleteFitness: any = null
    if (athleteRes.ok) {
      athleteFitness = await athleteRes.json()
      console.log(`[Sync] Athlete fitness current:`, { ctl: athleteFitness.ctl, atl: athleteFitness.atl, tsb: athleteFitness.tsb })
    }

    const wellnessRes = await fetch(`${INTERVALS_BASE}/athlete/${athleteId}/wellness?oldest=${oldestStr}&newest=${newestStr}`, {
      headers: { 'Authorization': authHeader },
      cache: 'no-store'
    })
    
    if (wellnessRes.ok) {
      const wellnessData = await wellnessRes.json()
      if (Array.isArray(wellnessData)) {
        // Ensure today's date exists in the formatted array even if not in wellnessData
        let hasToday = wellnessData.some(w => w.id === newestStr);
        
        const formattedWellness = wellnessData.map((w: any) => {
          const ctl = w.ctl ?? w.icu_ctl ?? (w.id === newestStr ? athleteFitness?.ctl : null);
          const atl = w.atl ?? w.icu_atl ?? (w.id === newestStr ? athleteFitness?.atl : null);
          let tsb = w.tsb ?? w.icu_tsb ?? null;
          
          if (tsb === null && ctl !== null && atl !== null) {
            tsb = ctl - atl;
          } else if (tsb === null && w.id === newestStr && athleteFitness?.tsb !== undefined && athleteFitness?.tsb !== null) {
            tsb = athleteFitness.tsb;
          }

          return {
            user_id: userId,
            date: w.id,
            ctl,
            atl,
            tsb,
            hrv: w.hrv ?? w.icu_hrv ?? null,
            hrv_score: w.hrv_score,
            resting_hr: w.resting_hr,
            sleep_secs: w.sleep_secs,
            sleep_quality: w.sleep_quality,
            weight: w.weight,
            body_fat: w.body_fat,
            readiness: w.readiness,
            raw_data: w
          };
        });

        // If today is missing from historical wellness, add it from athlete data
        if (!hasToday && athleteFitness) {
          const ctl = athleteFitness.ctl ?? null;
          const atl = athleteFitness.atl ?? null;
          const tsb = athleteFitness.tsb ?? (ctl !== null && atl !== null ? ctl - atl : null);

          formattedWellness.push({
            user_id: userId,
            date: newestStr,
            ctl,
            atl,
            tsb,
            hrv: null,
            hrv_score: null,
            resting_hr: null,
            sleep_secs: null,
            sleep_quality: null,
            weight: null,
            body_fat: null,
            readiness: null,
            raw_data: athleteFitness
          });
        }
        
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

        // Cleanup: remove activities that are no longer present in Intervals
        const apiIds = new Set(formattedActivities.map((a: any) => a.id))
        const { data: existing, error: fetchExistingErr } = await supabase
          .from('activities')
          .select('id')
          .eq('user_id', userId)
          .gte('start_date', oldestStr)
        if (!fetchExistingErr && existing) {
          const idsToDelete = existing
            .filter((a: any) => !apiIds.has(a.id))
            .map((a: any) => a.id)
          if (idsToDelete.length > 0) {
            const { error: deleteErr } = await supabase
              .from('activities')
              .delete()
              .in('id', idsToDelete)
              .eq('user_id', userId)
            if (deleteErr) console.error('Failed to delete stale activities', deleteErr)
          }
        }
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
