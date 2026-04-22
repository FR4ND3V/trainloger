import { NextRequest, NextResponse } from "next/server";
import { CalendarEvent, SportType } from "@/app/types";
import ICAL from "ical.js";
import { getUserIntervalsCredentials, getIntervalsAuthHeader } from "@/utils/intervals";

const INTERVALS_BASE = "https://intervals.icu/api/v1";

function mapSportType(raw: string): SportType {
  const lower = (raw || "").toLowerCase();
  if (lower.includes("run")) return "Run";
  if (lower.includes("swim")) return "Swim";
  if (lower.includes("ride") || lower.includes("cycling") || lower.includes("bike")) return "Ride";
  if (lower.includes("core")) return "Core";
  if (lower.includes("strength") || lower.includes("strenght") || lower.includes("fuerza")) return "Strength";
  return "Other";
}

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// ─── Route Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      return NextResponse.json({ error: "Missing start or end params" }, { status: 400 });
    }

    // 1. Get current user
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const events: CalendarEvent[] = [];

    // 2. Fetch Activities from Supabase
    const { data: dbActivities } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_date_local', `${startParam}T00:00:00`)
      .lte('start_date_local', `${endParam}T23:59:59`);

    if (dbActivities) {
      dbActivities.forEach(a => {
        // Calculate end date based on elapsed time or moving time
        const startTime = new Date(a.start_date_local).getTime();
        const durationSeconds = a.elapsed_time || a.moving_time || 3600;
        const endTime = new Date(startTime + durationSeconds * 1000).toISOString();

        events.push({
          id: `activity-${a.id}`,
          title: a.name || "Training",
          start: a.start_date_local,
          end: endTime,
          type: "Training",
          sportType: mapSportType(a.sport_type || ""),
          description: a.raw_data?.description || "",
          distance: a.distance,
          duration: a.moving_time
        });
      });
    }

    // 3. Fetch Planned Events from Supabase
    const { data: dbEvents } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_date', `${startParam}T00:00:00`)
      .lte('start_date', `${endParam}T23:59:59`);

    if (dbEvents) {
      dbEvents.forEach(ev => {
        // Only add if not already represented as an activity (Intervals links them)
        const isAlreadyActivity = events.some(e => e.id === `activity-${ev.raw_data?.activity_id}`);
        if (!isAlreadyActivity) {
          events.push({
            id: `event-${ev.id}`,
            title: ev.title || "Planned",
            start: ev.start_date,
            end: ev.end_date,
            type: "Training",
            sportType: mapSportType(ev.type || ""),
            description: ev.description || "",
            distance: ev.distance,
            duration: ev.moving_time
          });
        }
      });
    }

    // 4. Fetch from External iCal (Google Calendar)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('calendar_ics_url')
      .eq('id', user.id)
      .single();

    const icsUrl = profile?.calendar_ics_url?.trim();
    if (icsUrl && icsUrl.startsWith('http')) {
      try {
        const calRes = await fetch(icsUrl, { 
          cache: 'no-store',
          signal: AbortSignal.timeout(5000) // Timeout after 5s
        });
        
        if (calRes.ok) {
          const calText = await calRes.text();
          const jcalData = ICAL.parse(calText);
          const comp = new ICAL.Component(jcalData);
          const vevents = comp.getAllSubcomponents('vevent');
          
          const queryStart = ICAL.Time.fromJSDate(new Date(startParam));
          const queryEnd = ICAL.Time.fromJSDate(new Date(endParam + "T23:59:59Z"));

          vevents.forEach(vevent => {
            const event = new ICAL.Event(vevent);
            if (event.isRecurring()) {
              const iter = event.iterator();
              let next;
              while ((next = iter.next())) {
                const occurrencesStart = next;
                const occurrenceEnd = occurrencesStart.clone();
                occurrenceEnd.addDuration(event.duration);
                if (occurrencesStart.compare(queryEnd) > 0) break;
                if (occurrenceEnd.compare(queryStart) >= 0) {
                  events.push({
                    id: `${event.uid}-${occurrencesStart.toString()}`,
                    title: event.summary,
                    start: occurrencesStart.toJSDate().toISOString(),
                    end: occurrenceEnd.toJSDate().toISOString(),
                    type: "Personal",
                    sportType: mapSportType(event.summary),
                    description: event.description || "",
                    isAllDay: occurrencesStart.isDate
                  });
                }
              }
            } else {
              const startDate = event.startDate;
              const endDate = event.endDate;
              if (endDate.compare(queryStart) >= 0 && startDate.compare(queryEnd) <= 0) {
                events.push({
                  id: event.uid || `ical-${Math.random()}`,
                  title: event.summary,
                  start: startDate.toJSDate().toISOString(),
                  end: endDate.toJSDate().toISOString(),
                  type: "Personal",
                  sportType: mapSportType(event.summary),
                  description: event.description || "",
                  isAllDay: startDate.isDate
                });
              }
            }
          });
        }
      } catch (err) {
        console.error("Graceful failure: External calendar fetch failed:", err);
        // We don't throw here so the user still sees their athletic activities
      }
    }

    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({ events });

  } catch (error) {
    console.error("Calendar API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
