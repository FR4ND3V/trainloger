import { NextRequest, NextResponse } from "next/server";
import type { WellnessData, Activity, DashboardData, SportType, ChartDataEntry } from "@/app/types";
import { getUserIntervalsCredentials, getIntervalsAuthHeader } from "@/utils/intervals";
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

// ─── Intervals.icu API Client ───────────────────────────────────────

const INTERVALS_BASE = "https://intervals.icu/api/v1";

async function fetchIntervals<T>(endpoint: string, authHeader: string): Promise<T> {
  const res = await fetch(`${INTERVALS_BASE}${endpoint}`, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Intervals.icu API error ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Data Extraction ────────────────────────────────────────────────

async function fetchWellness(
  athleteId: string, 
  authHeader: string,
  dateRange: { start: string; end: string },
  view: string
): Promise<{ wellness: WellnessData; summaryStats: any; rawWellness: any[] }> {
  const data = await fetchIntervals<any[]>(
    `/athlete/${athleteId}/wellness?oldest=${dateRange.start}&newest=${dateRange.end}`,
    authHeader
  );

  const latest = data.length > 0 ? data[data.length - 1] : null;

  const wellness: WellnessData = {
    ctl: latest?.ctl ?? null,
    atl: latest?.atl ?? null,
    tsb: latest?.rampRate ?? latest?.tsb ?? null,
    hrv: latest?.hrvSDNN ?? latest?.hrv ?? null,
    sleepScore: latest?.sleepScore ?? latest?.sleepQuality ?? null,
    restingHR: latest?.restingHR ?? null,
    readiness: latest?.readiness ?? null,
  };

  const summaryStats: any = {};

  if ((view === "monthly" || view === "yearly") && data.length > 0) {
    const hrvValues = data.map(d => d.hrvSDNN || d.hrv).filter(v => v != null);
    const tsbValues = data.map(d => d.rampRate || d.tsb).filter(v => v != null);

    if (hrvValues.length > 0) {
      summaryStats.maxHRV = Math.max(...hrvValues);
      summaryStats.minHRV = Math.min(...hrvValues);
    }
    if (tsbValues.length > 0) {
      summaryStats.avgTSB = tsbValues.reduce((a, b) => a + b, 0) / tsbValues.length;
    }
  }

  return { wellness, summaryStats, rawWellness: data };
}

async function fetchActivities(athleteId: string, authHeader: string, dateRange: { start: string; end: string }): Promise<Activity[]> {
  const data = await fetchIntervals<any[]>(
    `/athlete/${athleteId}/activities?oldest=${dateRange.start}&newest=${dateRange.end}`,
    authHeader
  );

  return data
    .filter((a) => {
      const type = (a.type || "").toLowerCase();
      return type === "run" || type === "swim" || type === "ride";
    })
    .map((a) => {
      const type = mapSportType(a.type);
      const distance = a.distance || 0;
      const duration = a.moving_time || a.elapsed_time || 0;

      const activity: Activity = {
        id: a.id?.toString() || crypto.randomUUID(),
        name: a.name || `${type} Session`,
        type,
        date: a.start_date_local || a.start_date || dateRange.start,
        distance,
        duration,
        avgHR: a.average_heartrate || a.hr || undefined,
        calories: a.calories || undefined,
        trainingLoad: a.icu_training_load || undefined,
      };

      if (type === "Run" && distance > 0) {
        const paceSecsPerKm = duration / (distance / 1000);
        const mins = Math.floor(paceSecsPerKm / 60);
        const secs = Math.round(paceSecsPerKm % 60);
        activity.pace = `${mins}:${secs.toString().padStart(2, "0")} /km`;

        if (a.gap) {
          const gapSecsPerKm = 1000 / a.gap;
          const gMins = Math.floor(gapSecsPerKm / 60);
          const gSecs = Math.round(gapSecsPerKm % 60);
          activity.gap = `${gMins}:${gSecs.toString().padStart(2, "0")} /km`;
        }
        activity.efficiencyFactor = a.icu_efficiency_factor;
        activity.aerobicDecoupling = a.decoupling;
        activity.avgCadence = a.average_cadence;
        activity.strideLength = a.average_stride;
      }

      if (type === "Swim" && distance > 0) {
        const paceSecs = duration / (distance / 100);
        const mins = Math.floor(paceSecs / 60);
        const secs = Math.round(paceSecs % 60);
        activity.pace = `${mins}:${secs.toString().padStart(2, "0")} /100m`;
        activity.swimPace = activity.pace;

        const laps = a.laps?.length || a.num_laps || Math.max(1, Math.round(distance / 25));
        const strokeCount = a.total_strokes || a.stroke_count || 0;
        if (strokeCount > 0 && laps > 0) {
          const avgStrokesPerLap = strokeCount / laps;
          const avgTimePerLap = duration / laps;
          activity.swolf = a.average_swolf || Math.round(avgStrokesPerLap + avgTimePerLap);
          activity.strokeCount = strokeCount;
          activity.laps = laps;
        }
      }

      return activity;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function mapSportType(raw: string): SportType {
  const lower = (raw || "").toLowerCase();
  if (lower === "run" || lower === "running") return "Run";
  if (lower === "swim" || lower === "swimming") return "Swim";
  if (lower === "ride" || lower === "cycling" || lower === "bike") return "Ride";
  return "Other";
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

    // 3. Fetch Wellness from Supabase
    const { data: dbWellness, error: wellnessErr } = await supabase
      .from('wellness')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: true });

    if (wellnessErr) throw wellnessErr;

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
    const latest = dbWellness.length > 0 ? dbWellness[dbWellness.length - 1] : null;
    const wellness: WellnessData = {
      ctl: latest?.ctl ?? null,
      atl: latest?.atl ?? null,
      tsb: latest?.tsb ?? null,
      hrv: latest?.hrv ?? null,
      sleepScore: latest?.sleep_score ?? latest?.sleep_quality ?? null,
      restingHR: latest?.resting_hr ?? null,
      readiness: latest?.readiness ?? null,
    };

    const summaryStats: any = {};
    if ((view === "monthly" || view === "yearly") && dbWellness.length > 0) {
      const hrvValues = dbWellness.map(d => d.hrv).filter(v => v != null);
      const tsbValues = dbWellness.map(d => d.tsb).filter(v => v != null);
      if (hrvValues.length > 0) {
        summaryStats.maxHRV = Math.max(...hrvValues);
        summaryStats.minHRV = Math.min(...hrvValues);
      }
      if (tsbValues.length > 0) {
        summaryStats.avgTSB = tsbValues.reduce((a, b) => a + b, 0) / tsbValues.length;
      }
    }

    // 6. Transform Activities Data
    const activities: Activity[] = dbActivities.map(a => {
      const type = a.sport_type as SportType;
      const distance = a.distance || 0;
      const duration = a.moving_time || a.elapsed_time || 0;

      const activity: Activity = {
        id: a.id,
        name: a.name || `${type} Session`,
        type,
        date: a.start_date_local || a.start_date,
        distance,
        duration,
        avgHR: a.average_heartrate || undefined,
        calories: a.calories || undefined,
        trainingLoad: a.training_load || a.tss || undefined,
      };

      // Add Pace/Efficiency for Run/Swim
      if (type === "Run" && distance > 0) {
        const paceSecsPerKm = duration / (distance / 1000);
        const mins = Math.floor(paceSecsPerKm / 60);
        const secs = Math.round(paceSecsPerKm % 60);
        activity.pace = `${mins}:${secs.toString().padStart(2, "0")} /km`;
        activity.efficiencyFactor = a.raw_data?.icu_efficiency_factor;
        activity.gap = a.raw_data?.gap_pace; // If stored in raw_data
      }

      if (type === "Swim" && distance > 0) {
        const paceSecs = duration / (distance / 100);
        const mins = Math.floor(paceSecs / 60);
        const secs = Math.round(paceSecs % 60);
        activity.pace = `${mins}:${secs.toString().padStart(2, "0")} /100m`;
        activity.swolf = a.swolf || a.raw_data?.average_swolf;
      }

      return activity;
    });

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
      chartDataMap[date] = {
        date,
        ctl: w.ctl || null,
        atl: w.atl || null,
        tsb: w.tsb || null,
        runDistance: 0,
        swimDistance: 0
      };
    });

    activities.forEach(a => {
      const date = a.date.split("T")[0];
      if (!chartDataMap[date]) {
        chartDataMap[date] = { date, ctl: null, atl: null, tsb: null, runDistance: 0, swimDistance: 0 };
      }
      if (a.type === "Run") chartDataMap[date].runDistance += a.distance;
      if (a.type === "Swim") chartDataMap[date].swimDistance += a.distance;
    });

    const chartData = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));

    // 9. Final Response
    const response: DashboardData = {
      wellness,
      activities,
      weekRange: dateRange,
      summary,
      chartData,
      syncedAt: dbWellness.length > 0 ? dbWellness[dbWellness.length - 1].synced_at : new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Stats API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
