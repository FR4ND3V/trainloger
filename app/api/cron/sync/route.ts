import { NextRequest, NextResponse } from 'next/server'
import { syncUserData } from '@/utils/sync'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  // 1. Basic Auth / Secret Check
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 2. Fetch all users with configured intervals
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id')
      .not('intervals_athlete_id', 'is', null)

    if (error) throw error

    console.log(`Cron: Starting sync for ${users?.length} users...`)

    // 3. Trigger sync for each user
    const results = await Promise.allSettled(
      users.map(u => syncUserData(u.id, 7)) // Sync last 7 days daily
    )

    const successCount = results.filter(r => r.status === 'fulfilled').length
    
    return NextResponse.json({
      processed: users.length,
      success: successCount,
      failed: users.length - successCount
    })

  } catch (err: any) {
    console.error('Cron sync failed:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
