import { NextRequest, NextResponse } from "next/server";
import type { WellnessData, Activity, DashboardData, SportType, ChartDataEntry } from "@/app/types";
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// ─── Date Range Helpers ─────────────────────────────────────────────

function getLastWeekRange(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(lastMonday), end: fmt(lastSunday) };
}

function getMonthRange(month: number, year: number): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  end.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

function getYearRange(year: number): { start: string; end: string } {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  end.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

function mapSportType(raw: string): SportType {
  const lower = (raw || "").toLowerCase();
  
  // Cycling normalization
  if (
    lower === "ride" || 
    lower === "cycling" || 
    lower === "bike" || 
    lower === "virtualride" || 
    lower === "ebikeride" || 
    lower.includes("cycling") || 
    lower.includes("bike") ||
    lower.includes("ride")
  ) {
    return "Ride";
  }

  // Running normalization
  if (
    lower === "run" || 
    lower === "running" || 
    lower === "virtualrun" || 
    lower === "trailrun" || 
    lower === "treadmill" ||
    lower.includes("run")
  ) {
    return "Run";
  }

  // Swimming normalization
  if (
    lower === "swim" || 
    lower === "swimming" ||
    lower.includes("swim")
  ) {
    return "Swim";
  }

  if (lower.includes("core") || lower.includes("pilates")) return "Core";
  if (lower.includes("strength") || lower.includes("weight")) return "Strength";

  return "Other";
}

// ─── Activity Transformation ────────────────────────────────────────

function transformActivity(a: any): Activity {
  const type = mapSportType(a.sport_type || a.type || "");
  const distance = a.distance || 0;
  const duration = a.moving_time || a.elapsed_time || 0;
  const raw = a.raw_data || {};

  const activity: Activity = {
    id: a.id,
    name: a.name || `${type} Session`,
    type,
    date: a.start_date_local || a.start_date,
    distance,
    duration,
    avgHR: a.average_heartrate || raw.average_heartrate || undefined,
    maxHR: a.max_heartrate || raw.max_heartrate || undefined,
    calories: a.calories || raw.calories || undefined,
    trainingLoad: a.training_load || a.tss || raw.suffer_score || undefined,
    elevationGain: a.total_elevation_gain || raw.total_elevation_gain || undefined,
    mapPolyline: a.map_polyline || raw.map?.summary_polyline || raw.summary_polyline || raw.polyline || raw.map_polyline || undefined,
  };

  if (!activity.mapPolyline) {
     // Check if it's nested in a way Intervals sometimes does
     if (raw.icu_map_polyline) activity.mapPolyline = raw.icu_map_polyline;
  }

  // ─── Run ───────────────────────────────────────────────────────
  if (type === "Run" && distance > 0) {
    const paceSecsPerKm = duration / (distance / 1000);
    const mins = Math.floor(paceSecsPerKm / 60);
    const secs = Math.round(paceSecsPerKm % 60);
    activity.pace = `${mins}:${secs.toString().padStart(2, "0")} /km`;
    activity.efficiencyFactor = a.efficiency_factor || raw.icu_efficiency_factor;
    activity.aerobicDecoupling = a.decoupling || raw.decoupling;
    activity.avgCadence = a.average_cadence || raw.average_cadence;
    activity.strideLength = a.average_stride || raw.average_stride;

    // GAP (Grade Adjusted Pace)
    const gapRaw = a.gap || raw.gap;
    if (gapRaw) {
      if (typeof gapRaw === "string") {
        activity.gap = gapRaw;
      } else {
        const gapSecsPerKm = 1000 / gapRaw;
        const gMins = Math.floor(gapSecsPerKm / 60);
        const gSecs = Math.round(gapSecsPerKm % 60);
        activity.gap = `${gMins}:${gSecs.toString().padStart(2, "0")} /km`;
      }
    }
  }

  // ─── Swim ──────────────────────────────────────────────────────
  if (type === "Swim" && distance > 0) {
    const paceSecs = duration / (distance / 100);
    const mins = Math.floor(paceSecs / 60);
    const secs = Math.round(paceSecs % 60);
    activity.pace = `${mins}:${secs.toString().padStart(2, "0")} /100m`;
    activity.swimPace = activity.pace;

    const laps = a.laps || raw.num_laps || Math.max(1, Math.round(distance / 25));
    const strokeCount = a.total_strokes || raw.total_strokes || raw.stroke_count || 0;
    if (strokeCount > 0 && laps > 0) {
      const avgStrokesPerLap = strokeCount / laps;
      const avgTimePerLap = duration / laps;
      activity.swolf = a.swolf || raw.average_swolf || Math.round(avgStrokesPerLap + avgTimePerLap);
      activity.strokeCount = strokeCount;
      activity.laps = laps;
    }
  }

  // ─── Ride ──────────────────────────────────────────────────────
  if (type === "Ride" && distance > 0) {
    // Speed in km/h
    const speedKmh = (distance / 1000) / (duration / 3600);
    activity.avgSpeed = Math.round(speedKmh * 10) / 10;
    activity.pace = `${activity.avgSpeed.toFixed(1)} km/h`;

    // Power metrics
    activity.avgPower = a.average_watts || raw.average_watts || undefined;
    activity.maxPower = a.max_watts || raw.max_watts || undefined;
    activity.normalizedPower = a.normalized_power || raw.normalized_power || raw.weighted_average_watts || undefined;
    activity.intensityFactor = a.intensity_factor || raw.intensity_factor || undefined;
    activity.tss = a.tss || raw.tss || raw.training_stress_score || undefined;
    activity.avgCadenceBike = a.average_cadence || raw.average_cadence || undefined;
  }

  return activity;
}

// ─── Route Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const view = searchParams.get("view") || "weekly";
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // 1. Get current user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // 2. Establish date range
    let dateRange;
    if (view === "yearly") {
      dateRange = getYearRange(year);
    } else if (view === "monthly") {
      dateRange = getMonthRange(month, year);
    } else {
      dateRange = getLastWeekRange();
    }

    // 3. Fetch Wellness for the Chart (Range limited)
    const { data: dbWellness, error: wellnessErr } = await supabase
      .from('wellness')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: true });

    if (wellnessErr) throw wellnessErr;

    console.log(`[Stats API] Found ${dbWellness?.length || 0} wellness records in range`);

    // 3b. Fetch the absolute LATEST Wellness for current metrics
    const { data: latestWellness } = await supabase
      .from('wellness')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(); // maybeSingle instead of single to avoid error if empty

    console.log(`[Stats API] Latest wellness record:`, latestWellness ? { date: latestWellness.date, tsb: latestWellness.tsb } : 'NONE');

    // 4. Fetch Activities from Supabase
    const { data: dbActivities, error: activitiesErr } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_date_local', `${dateRange.start}T00:00:00`)
      .lte('start_date_local', `${dateRange.end}T23:59:59`)
      .order('start_date_local', { ascending: false });

    if (activitiesErr) throw activitiesErr;

    // 5. Transform Wellness Data
    const latest = latestWellness || (dbWellness.length > 0 ? dbWellness[dbWellness.length - 1] : null);
    
    const latestCtl = latest?.ctl ?? null;
    const latestAtl = latest?.atl ?? null;
    const latestTsb = latest?.tsb !== null && latest?.tsb !== undefined
      ? latest.tsb
      : (latestCtl !== null && latestAtl !== null ? latestCtl - latestAtl : null);

    const wellness: WellnessData = {
      ctl: latestCtl,
      atl: latestAtl,
      tsb: latestTsb,
      hrv: latest?.hrv ?? null,
      sleepScore: latest?.sleep_score ?? latest?.sleep_quality ?? null,
      restingHR: latest?.resting_hr ?? null,
      readiness: latest?.readiness ?? null,
    };

    const summaryStats: any = {
      avgTSB: null,
      maxHRV: null,
      minHRV: null,
    };
    
    if ((view === "monthly" || view === "yearly") && dbWellness.length > 0) {
      const hrvValues = dbWellness.map(d => d.hrv).filter(v => v != null);
      const tsbValues = dbWellness.map(d => {
        const c = d.ctl ?? null;
        const a = d.atl ?? null;
        return d.tsb !== null && d.tsb !== undefined ? d.tsb : (c !== null && a !== null ? c - a : null);
      }).filter(v => v != null);
      if (hrvValues.length > 0) {
        summaryStats.maxHRV = Math.max(...hrvValues);
        summaryStats.minHRV = Math.min(...hrvValues);
      }
      if (tsbValues.length > 0) {
        summaryStats.avgTSB = tsbValues.reduce((a: number, b: number) => a + b, 0) / tsbValues.length;
      }
    }

    // 6. Transform Activities
    const activities: Activity[] = dbActivities.map(transformActivity);
    if (activities.length > 0) {
      console.log(`[Stats API] Debugging first activity:`, {
        id: dbActivities[0].id,
        sport_type: dbActivities[0].sport_type,
        has_raw: !!dbActivities[0].raw_data,
        raw_id: dbActivities[0].raw_data?.id
      });
    }

    // 7. Aggregate Summary
    const summary = {
      totalDistanceRun: activities.filter(a => a.type === "Run").reduce((sum, a) => sum + a.distance, 0),
      totalDistanceSwim: activities.filter(a => a.type === "Swim").reduce((sum, a) => sum + a.distance, 0),
      totalDistanceRide: activities.filter(a => a.type === "Ride").reduce((sum, a) => sum + a.distance, 0),
      totalDistance: activities.reduce((sum, a) => sum + a.distance, 0),
      totalCalories: activities.reduce((sum, a) => sum + (a.calories || 0), 0),
      totalTrainingLoad: activities.reduce((sum, a) => sum + (a.trainingLoad || 0), 0),
      avgTSB: summaryStats.avgTSB ?? wellness.tsb,
      maxHRV: summaryStats.maxHRV ?? wellness.hrv,
      minHRV: summaryStats.minHRV ?? wellness.hrv,
    };

    // 8. Build Chart Data
    const chartDataMap: Record<string, ChartDataEntry> = {};
    dbWellness.forEach(w => {
      const date = w.date;
      const ctl = w.ctl || null;
      const atl = w.atl || null;
      const tsb = w.tsb !== null && w.tsb !== undefined ? w.tsb : (ctl !== null && atl !== null ? ctl - atl : null);

      chartDataMap[date] = {
        date,
        ctl,
        atl,
        tsb,
        runDistance: 0,
        swimDistance: 0,
        rideDistance: 0,
        runDuration: 0,
        swimDuration: 0,
        rideDuration: 0,
      };
    });

    activities.forEach(a => {
      const date = a.date.split("T")[0];
      if (!chartDataMap[date]) {
        chartDataMap[date] = {
          date,
          ctl: null,
          atl: null,
          tsb: null,
          runDistance: 0,
          swimDistance: 0,
          rideDistance: 0,
          runDuration: 0,
          swimDuration: 0,
          rideDuration: 0,
        };
      }
      const durationMins = (a.duration || 0) / 60;
      if (a.type === "Run") {
        chartDataMap[date].runDistance += a.distance;
        chartDataMap[date].runDuration = (chartDataMap[date].runDuration || 0) + durationMins;
      }
      if (a.type === "Swim") {
        chartDataMap[date].swimDistance += a.distance;
        chartDataMap[date].swimDuration = (chartDataMap[date].swimDuration || 0) + durationMins;
      }
      if (a.type === "Ride") {
        chartDataMap[date].rideDistance += a.distance;
        chartDataMap[date].rideDuration = (chartDataMap[date].rideDuration || 0) + durationMins;
      }
    });

    const chartData = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));

    // 9. Final Response
    const response: DashboardData & { debugInfo?: any } = {
      wellness,
      activities,
      weekRange: dateRange,
      summary,
      chartData,
      syncedAt: dbWellness.length > 0 ? dbWellness[dbWellness.length - 1].synced_at : new Date().toISOString(),
      debugInfo: activities.length > 0 ? {
        id: dbActivities[0].id,
        raw_id: dbActivities[0].raw_data?.id,
        icu_id: dbActivities[0].raw_data?.icu_id
      } : null
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Stats API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
