import { NextRequest, NextResponse } from "next/server";
import { CalendarEvent, SportType } from "@/app/types";
import ICAL from "ical.js";

const INTERVALS_BASE = "https://intervals.icu/api/v1";

function getAuthHeader(): string {
  const apiKey = process.env.INTERVALS_API_KEY;
  if (!apiKey) throw new Error("INTERVALS_API_KEY is not set");
  const encoded = Buffer.from(`API_KEY:${apiKey}`).toString("base64");
  return `Basic ${encoded}`;
}

function getAthleteId(): string {
  const id = process.env.INTERVALS_ATHLETE_ID;
  if (!id) throw new Error("INTERVALS_ATHLETE_ID is not set");
  return id;
}

function mapSportType(raw: string): SportType {
  const lower = (raw || "").toLowerCase();
  if (lower.includes("run")) return "Run";
  if (lower.includes("swim")) return "Swim";
  if (lower.includes("ride") || lower.includes("cycling") || lower.includes("bike")) return "Ride";
  return "Other";
}

// Ensure the month start and end cover the whole grid (e.g. from previous month end to next month start)
// But for simplicity, the client sends 'start' and 'end'
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      return NextResponse.json({ error: "Missing start or end params" }, { status: 400 });
    }

    const athleteId = getAthleteId();
    const events: CalendarEvent[] = [];

    // 1. Fetch from Intervals.icu Events (Planned Workouts)
    try {
      const res = await fetch(`${INTERVALS_BASE}/athlete/${athleteId}/events?oldest=${startParam}&newest=${endParam}`, {
        headers: {
          Authorization: getAuthHeader(),
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (res.ok) {
        const intervalsData = await res.json();
        // Check if array
        if (Array.isArray(intervalsData)) {
            intervalsData.forEach((ev: any) => {
              if (ev.category === "WORKOUT" || ev.category === "ACTIVITY" || ev.type) {
                  const sportType = mapSportType(ev.type || ev.name || "");
                  events.push({
                      id: `intervals-${ev.id}`,
                      title: ev.name || ev.type || "Training",
                      start: ev.start_date_local || ev.start_date,
                      end: ev.end_date_local || ev.end_date || ev.start_date_local || ev.start_date,
                      type: "Training",
                      sportType,
                      description: ev.description || "",
                      distance: ev.distance,
                      duration: ev.moving_time || ev.elapsed_time
                  });
              }
            });
        }
      } else {
        console.warn("Intervals.icu events returned:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch Intervals events:", err);
    }

    // 2. Fetch from External iCal (Google Calendar)
    const icsUrl = process.env.CALENDAR_ICS_URL;
    if (icsUrl) {
      try {
        const calRes = await fetch(icsUrl, { cache: 'no-store' });
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
            // Iterate and find instances in range
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
      } catch (err) {
        console.error("Failed to parse ICS with ical.js:", err);
      }
    }

    // Sort events by start date
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json({ events });

  } catch (error) {
    console.error("Calendar API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
