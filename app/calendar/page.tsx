"use client";

import { useState, useEffect } from "react";
import CalendarView from "../components/CalendarView";
import type { CalendarEvent } from "../types";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to load a wide range of events once, or based on major navigation
  // For simplicity and to avoid too many fetches with FullCalendar, 
  // we fetch a generous 4-month window around the current date.
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);

    try {
      const res = await fetch(`/api/calendar?start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`);
      
      if (!res.ok) throw new Error("Error cargando el calendario");
      
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch(e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            <span className="text-label text-[11px] text-[var(--accent)] tracking-[0.2em] font-mono">
              [ INICIALIZANDO PLANNER ]
            </span>
          </div>
        ) : error ? (
          <div className="nothing-card p-12 border-red-900/30 text-center space-y-4">
             <p className="text-red-500 font-mono text-sm tracking-widest uppercase">Error de Sincronización</p>
             <button onClick={loadEvents} className="btn-nothing btn-secondary">Reintentar</button>
          </div>
        ) : (
          <CalendarView events={events} />
        )}

      </div>
    </div>
  );
}
