"use client";

import React from "react";
import { 
  X, 
  MapPin, 
  Clock, 
  Activity, 
  AlignLeft,
  Calendar as CalendarIcon,
  Trophy,
  Zap
} from "lucide-react";
import type { CalendarEvent } from "../types";

interface CalendarDetailModalProps {
  event: CalendarEvent;
  onClose: () => void;
}

export default function CalendarDetailModal({ event, onClose }: CalendarDetailModalProps) {
  const isTraining = event.type === "Training";
  const startTime = new Date(event.start).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });
  const endTime = new Date(event.end).toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg nothing-card p-8 shadow-2xl animate-fade-in-up" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--surface-raised)] transition-colors text-[var(--text-disabled)] hover:text-[var(--text-primary)]"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-mono tracking-widest uppercase border ${
              isTraining 
                ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' 
                : 'bg-white/5 border-white/10 text-[var(--text-secondary)]'
            }`}>
              {event.sportType || event.type}
            </div>
          </div>
          <h2 className="text-display-md text-[var(--text-display)] uppercase leading-tight tracking-tight">
            {event.title}
          </h2>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[var(--surface-raised)]">
                <Clock className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-label text-[10px] text-[var(--text-disabled)] uppercase mb-1">Horario</p>
                <p className="font-mono text-[13px] text-[var(--text-primary)]">
                  {event.isAllDay ? "Todo el día" : `${startTime} — ${endTime}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[var(--surface-raised)]">
                <CalendarIcon className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-label text-[10px] text-[var(--text-disabled)] uppercase mb-1">Fecha</p>
                <p className="font-mono text-[13px] text-[var(--text-primary)]">
                  {new Date(event.start).toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
          </div>

          {(event.distance || event.duration) && (
            <div className="space-y-6">
              {event.distance && (
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--accent)]/20">
                    <Trophy className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-label text-[10px] text-[var(--text-disabled)] uppercase mb-1">Distancia Prevista</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono text-[var(--text-display)]">{(event.distance / 1000).toFixed(1)}</span>
                      <span className="text-[10px] font-mono text-[var(--text-disabled)] uppercase">KM</span>
                    </div>
                  </div>
                </div>
              )}

              {event.duration && (
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--accent)]/20">
                    <Zap className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-label text-[10px] text-[var(--text-disabled)] uppercase mb-1">Tiempo Mov.</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono text-[var(--text-display)]">{Math.round(event.duration / 60)}</span>
                      <span className="text-[10px] font-mono text-[var(--text-disabled)] uppercase">MIN</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description / Metadata */}
        {(event.description) && (
          <div className="space-y-4 pt-8 border-t border-white/5">
            <div className="flex items-center gap-2 text-[var(--text-disabled)] mb-2">
              <AlignLeft className="h-3 w-3" strokeWidth={1.5} />
              <span className="text-label text-[10px] uppercase tracking-wider">Notas & Detalles</span>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
            
            {isTraining && (
                <div className="flex items-center gap-2 mt-4 text-[10px] font-mono text-[var(--accent)] opacity-80 uppercase tracking-widest justify-center italic">
                   /// AI PERFORMANCE SYSTEM SYNCED ///
                </div>
            )}
          </div>
        )}
      </div>
      
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
