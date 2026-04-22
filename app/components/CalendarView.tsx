"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  User, 
  Maximize2, 
  Settings2,
  ListFilter
} from "lucide-react";
import type { CalendarEvent } from "../types";
import CalendarDetailModal from "./CalendarDetailModal";

interface CalendarViewProps {
  events: CalendarEvent[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState<"monthly" | "weekly">("monthly");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentTitle, setCurrentTitle] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>(["Run", "Swim", "Ride", "Core", "Strength", "Other", "Personal"]);

  // Map our events to FullCalendar format
  const fcEvents = events.map(ev => {
    let color = "#3f3f46"; // Default Zinc-600
    let textColor = "#a1a1aa"; // Zinc-400
    let borderColor = "#27272a"; // Zinc-800

    // Apply colors based on sportType if available
    if (ev.sportType === "Run") {
      color = "rgba(59, 130, 246, 0.1)"; // Blue-500 tint
      borderColor = "#3b82f6";
      textColor = "#60a5fa";
    } else if (ev.sportType === "Swim") {
      color = "rgba(34, 211, 238, 0.1)"; // Cyan-400 tint
      borderColor = "#22d3ee";
      textColor = "#67e8f9";
    } else if (ev.sportType === "Ride") {
      color = "rgba(249, 115, 22, 0.1)"; // Orange-500 tint
      borderColor = "#f97316";
      textColor = "#fb923c";
    } else if (ev.sportType === "Core") {
      color = "rgba(16, 185, 129, 0.1)"; // Emerald-500 tint
      borderColor = "#10b981";
      textColor = "#34d399";
    } else if (ev.sportType === "Strength") {
      color = "rgba(245, 158, 11, 0.1)"; // Amber-500 tint
      borderColor = "#f5a623";
      textColor = "#fbbf24";
    } else if (ev.type === "Training") {
      // Default ट्रेनिंग colors
      color = "rgba(168, 85, 247, 0.1)"; // Purple-500 tint
      borderColor = "#a855f7";
      textColor = "#c084fc";
    }

    return {
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.isAllDay,
      extendedProps: { ...ev },
      backgroundColor: color,
      borderColor: borderColor,
      textColor: textColor,
      className: `fc-event-${ev.sportType?.toLowerCase() || 'default'}`
    };
  });
  
  // Filter events based on active filters
  const filteredFcEvents = fcEvents.filter(ev => {
    const sport = ev.extendedProps.sportType || "Other";
    const type = ev.extendedProps.type;

    // 1. If it has a specific sport detected and that sport is active
    if (sport !== "Other" && activeFilters.includes(sport)) {
        return true;
    }

    // 2. If it's a generic Training event (Other)
    if (type === "Training" && sport === "Other" && activeFilters.includes("Other")) {
        return true;
    }

    // 3. If it's a Personal event not detected as a sport, check "Personal" toggle
    if (type === "Personal" && sport === "Other" && activeFilters.includes("Personal")) {
        return true;
    }

    return false;
  });

  const toggleFilter = (type: string) => {
    setActiveFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  useEffect(() => {
    if (calendarRef.current) {
        setCurrentTitle(calendarRef.current.getApi().view.title);
    }
  }, [events]);

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
    setCurrentTitle(calendarRef.current?.getApi().view.title || "");
  };

  const handleNext = () => {
    calendarRef.current?.getApi().next();
    setCurrentTitle(calendarRef.current?.getApi().view.title || "");
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
    setCurrentTitle(calendarRef.current?.getApi().view.title || "");
  };

  const toggleView = (v: "monthly" | "weekly") => {
    setView(v);
    const api = calendarRef.current?.getApi();
    if (api) {
        api.changeView(v === "monthly" ? "dayGridMonth" : "timeGridWeek");
        setCurrentTitle(api.view.title);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Custom Control Header */}
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-[var(--text-disabled)] tracking-[0.2em]">
              <Maximize2 className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-label uppercase">Interactive Planner // v2.0</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-display-lg text-[var(--text-display)] uppercase leading-tight">
                {currentTitle || "Calendario"}
              </h1>
              <p className="text-label text-[var(--text-secondary)]">Sincronización Multicapa // Google + Intervals</p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {/* View Switcher */}
              <div className="inline-flex p-1 border border-[var(--border-visible)] rounded-[12px] bg-[var(--surface)]">
                {(["monthly", "weekly"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => toggleView(v)}
                    className={`px-8 py-2.5 text-label transition-all duration-300 rounded-[8px] min-h-[40px] ${
                      view === v 
                        ? "bg-[var(--text-display)] text-black font-bold shadow-lg" 
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {v === "monthly" ? "Cuadrícula" : "Agenda"}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button onClick={handlePrev} className="btn-nothing btn-secondary p-3 rounded-xl border-[#ffffff10]">
                   <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={handleToday} className="btn-nothing btn-secondary px-8 text-[11px] font-mono tracking-widest uppercase transition-all hover:border-[var(--accent)]">
                   HOY
                </button>
                <button onClick={handleNext} className="btn-nothing btn-secondary p-3 rounded-xl border-[#ffffff10]">
                   <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[var(--text-disabled)] font-mono text-[10px] tracking-widest opacity-40 uppercase">
             <Settings2 className="h-4 w-4" />
             <span>Configuración de Estilo Aplicada</span>
          </div>
      </div>

      <div className="nothing-card p-6 lg:p-10 border-[#ffffff08] bg-black/20 overflow-hidden relative group">
        {/* FullCalendar Component */}
        <div className="calendar-container custom-fc-theme">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false} // We use custom header
            events={filteredFcEvents}
            dayMaxEvents={3}
            selectable={true}
            editable={true}
            nowIndicator={true}
            eventClick={(info) => {
               setSelectedEvent(info.event.extendedProps as CalendarEvent);
            }}
            locale="es"
            firstDay={1}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot={true}
            eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
            }}
          />
        </div>
      </div>

      {/* Legend & Interactive Filtering */}
      <div className="flex flex-wrap items-center gap-6 px-6 py-4 border border-[var(--border-visible)] rounded-2xl bg-[var(--surface)]/50 backdrop-blur-sm">
         <button 
           onClick={() => toggleFilter("Run")}
           className={`flex items-center gap-2.5 transition-all duration-300 ${activeFilters.includes("Run") ? "opacity-100" : "opacity-30 grayscale"}`}
         >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">Carrera</span>
         </button>
         
         <button 
           onClick={() => toggleFilter("Swim")}
           className={`flex items-center gap-2.5 transition-all duration-300 ${activeFilters.includes("Swim") ? "opacity-100" : "opacity-30 grayscale"}`}
         >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">Natación</span>
         </button>
         
         <button 
           onClick={() => toggleFilter("Ride")}
           className={`flex items-center gap-2.5 transition-all duration-300 ${activeFilters.includes("Ride") ? "opacity-100" : "opacity-30 grayscale"}`}
         >
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">Ciclismo</span>
         </button>

         <button 
           onClick={() => toggleFilter("Core")}
           className={`flex items-center gap-2.5 transition-all duration-300 ${activeFilters.includes("Core") ? "opacity-100" : "opacity-30 grayscale"}`}
         >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">Core</span>
         </button>

         <button 
           onClick={() => toggleFilter("Strength")}
           className={`flex items-center gap-2.5 transition-all duration-300 ${activeFilters.includes("Strength") ? "opacity-100" : "opacity-30 grayscale"}`}
         >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">Fuerza</span>
         </button>

         <button 
           onClick={() => toggleFilter("Personal")}
           className={`flex items-center gap-2.5 border-l border-white/10 pl-8 ml-auto transition-all duration-300 ${activeFilters.includes("Personal") ? "opacity-100" : "opacity-30 grayscale"}`}
         >
            <ListFilter className="h-3 w-3 text-[var(--interactive)]" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-primary)]">Google Cal</span>
         </button>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <CalendarDetailModal 
            event={selectedEvent} 
            onClose={() => setSelectedEvent(null)} 
        />
      )}

      {/* Custom Global Styles for FullCalendar */}
      <style jsx global>{`
        .custom-fc-theme .fc {
          --fc-border-color: rgba(255, 255, 255, 0.05);
          --fc-daygrid-event-dot-width: 6px;
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: transparent;
          --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.03);
          font-family: var(--font-mono), monospace;
          color: var(--text-primary);
        }

        .custom-fc-theme .fc-theme-standard td, 
        .custom-fc-theme .fc-theme-standard th {
          border-color: rgba(255, 255, 255, 0.05);
        }

        .custom-fc-theme .fc-col-header-cell {
          padding: 16px 0;
          font-size: 10px;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-disabled);
          background: transparent;
        }

        .custom-fc-theme .fc-daygrid-day-number {
          padding: 12px;
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none !important;
        }

        .custom-fc-theme .fc-day-today {
          background: rgba(255, 255, 255, 0.02) !important;
        }

        .custom-fc-theme .fc-day-today .fc-daygrid-day-number {
          color: var(--accent);
          font-weight: bold;
        }

        .custom-fc-theme .fc-event {
          border-radius: 6px;
          padding: 3px 6px;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border-width: 1px;
          margin: 2px 4px;
        }

        .custom-fc-theme .fc-event:hover {
          transform: translateY(-1px);
          filter: brightness(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }

        .custom-fc-theme .fc-scrollgrid {
          border-radius: 12px;
          overflow: hidden;
          border: none !important;
        }

        .custom-fc-theme .fc-timegrid-slot {
          height: 60px !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .custom-fc-theme .fc-timegrid-slot-label {
          font-size: 10px;
          color: var(--text-disabled);
          text-transform: uppercase;
        }

        .custom-fc-theme .fc-v-event {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Hide those annoying default scrolls in bento */
        .fc-scroller::-webkit-scrollbar {
          width: 4px;
        }
        .fc-scroller::-webkit-scrollbar-track {
          background: transparent;
        }
        .fc-scroller::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
