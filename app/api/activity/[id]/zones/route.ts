import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getUserIntervalsCredentials, getIntervalsAuthHeader } from "@/utils/intervals";

const INTERVALS_BASE = "https://intervals.icu/api/v1";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // ─── 1. Check Database First ──────────────────────────────────
    // This is faster and avoids 404s if the ID is slightly different
    const { data: dbActivity } = await supabase
      .from('activities')
      .select('raw_data')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    let data = dbActivity?.raw_data;

    // ─── 2. If not in DB or no zones in raw_data, fetch from Intervals
    if (!data || (!data.time_in_z && !data.icu_hr_zones && !data.hr_zones)) {
      // Try to get Intervals credentials
      let creds;
      try {
        creds = await getUserIntervalsCredentials(user.id);
      } catch {
        return NextResponse.json({ hr: [], power: [] });
      }

      const authHeader = getIntervalsAuthHeader(creds.apiKey);
      
      // Clean ID only if it starts with 'i' (Intervals)
      const fetchId = id.startsWith('i') ? id.substring(1) : id;

      const res = await fetch(`${INTERVALS_BASE}/activity/${fetchId}?include_zones=true`, {
        headers: { Authorization: authHeader, Accept: "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        data = await res.json();
      } else {
        console.error(`[Zones API] Intervals.icu error: ${res.status} for ID ${fetchId}`);
        // If we have some data from DB even without zones, we use it as last resort
        if (!data) return NextResponse.json({ hr: [], power: [] });
      }
    }

    if (!data) return NextResponse.json({ hr: [], power: [] });

    // ─── 3. Parse Zones (Distribution and Definitions) ──────────────
    
    // Distributions (seconds in each zone)
    const hrDistribution = data.time_in_z || data.icu_hr_zone_times || data.hr_zone_times || [];
    const powerDistribution = data.time_in_z_pwr || data.icu_power_zone_times || data.power_zone_times || [];
    
    // Zone Definitions (names, min, max)
    const hrDefs = data.icu_hr_zones || data.hr_zones || [];
    const powerDefs = data.icu_power_zones || data.power_zones || [];
    
    const totalTime = data.elapsed_time || data.moving_time || 1;
    const movingTime = data.moving_time || totalTime;

    // HR Zones
    let hrZones = [];
    if (hrDistribution.length > 0) {
      hrZones = hrDistribution.map((secs: number, i: number) => {
        const def = hrDefs[i] || {};
        return {
          zone: i + 1,
          name: def.name || `Zona ${i + 1}`,
          min: def.min || 0,
          max: def.max || 0,
          seconds: secs,
          percentage: (secs / totalTime) * 100,
        };
      }).filter((z: any) => z.seconds > 0);
    } else if (hrDefs.length > 0) {
       hrZones = hrDefs.map((z: any, i: number) => ({
          zone: i + 1,
          name: z.name || `Zona ${i + 1}`,
          min: z.min || 0,
          max: z.max || 0,
          seconds: z.secs || z.seconds || 0,
          percentage: z.percentage || ((z.secs || 0) / totalTime) * 100,
       })).filter((z: any) => z.seconds > 0);
    }

    // Power Zones
    let powerZones = [];
    if (powerDistribution.length > 0) {
      powerZones = powerDistribution.map((secs: number, i: number) => {
        const def = powerDefs[i] || {};
        return {
          zone: i + 1,
          name: def.name || `Zona ${i + 1}`,
          min: def.min || 0,
          max: def.max || 0,
          seconds: secs,
          percentage: (secs / movingTime) * 100,
        };
      }).filter((z: any) => z.seconds > 0);
    } else if (powerDefs.length > 0) {
      powerZones = powerDefs.map((z: any, i: number) => ({
        zone: i + 1,
        name: z.name || `Zona ${i + 1}`,
        min: z.min || 0,
        max: z.max || 0,
        seconds: z.secs || z.seconds || 0,
        percentage: z.percentage || ((z.secs || 0) / movingTime) * 100,
      })).filter((z: any) => z.seconds > 0);
    }

    console.log(`[Zones API] Resolved zones for ${id}: ${hrZones.length} HR, ${powerZones.length} Power`);

    return NextResponse.json({ hr: hrZones, power: powerZones });
  } catch (error) {
    console.error("Zones API error:", error);
    return NextResponse.json({ hr: [], power: [] });
  }
}
