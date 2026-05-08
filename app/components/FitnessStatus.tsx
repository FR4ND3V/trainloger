"use client";

import React from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, Zap, Info, Clock } from "lucide-react";

interface FitnessStatusProps {
  tsb: number | null | undefined;
  ctl?: number | null | undefined;
  atl?: number | null | undefined;
  loading?: boolean;
}

export default function FitnessStatus({ tsb, ctl, atl, loading }: FitnessStatusProps) {
  if (loading) {
    return (
      <div className="nothing-card p-6 h-full flex flex-col justify-between opacity-50 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-[var(--surface-raised)] rounded-full" />
          <div className="h-3 w-32 bg-[var(--surface-raised)] rounded" />
        </div>
        <div className="mt-8 space-y-4">
           <div className="h-8 w-48 bg-[var(--surface-raised)] rounded" />
           <div className="h-4 w-64 bg-[var(--surface-raised)] rounded" />
        </div>
      </div>
    );
  }

  // Handle case where data is loaded but TSB is missing
  const hasData = tsb !== null && tsb !== undefined;

  const getStatus = (val: number | null | undefined) => {
    if (val === null || val === undefined) return {
      label: "Sin Datos",
      desc: "Sincroniza tus datos para ver el estado.",
      color: "var(--text-disabled)",
      icon: <Info className="h-5 w-5" />,
      index: -1
    };
    if (val < -30) return { 
      label: "Alto Riesgo", 
      desc: "Sobrenamiento probable. Necesitas descanso urgente.",
      color: "#EF4444", 
      icon: <AlertTriangle className="h-5 w-5" />,
      index: 4 
    };
    if (val < -10) return { 
      label: "Optimo", 
      desc: "Zona ideal para mejora de rendimiento.",
      color: "#10B981", 
      icon: <CheckCircle2 className="h-5 w-5" />,
      index: 3 
    };
    if (val < 0) return { 
      label: "Zona gris", 
      desc: "Mantenimiento. Carga insuficiente para pico.",
      color: "#F59E0B", 
      icon: <Zap className="h-5 w-5" />,
      index: 2 
    };
    if (val < 10) return { 
      label: "Fresco", 
      desc: "Buen estado para competir o intensidad alta.",
      color: "#3B82F6", 
      icon: <Info className="h-5 w-5" />,
      index: 1 
    };
    return { 
      label: "Transicion", 
      desc: "Recuperación completa. Perdiendo adaptaciones.",
      color: "#6B7280", 
      icon: <Clock className="h-5 w-5" />,
      index: 0 
    };
  };

  const status = getStatus(tsb);
  const zones = ["Transicion", "Fresco", "Zona gris", "Optimo", "Alto Riesgo"];

  const formatTsb = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "—";
    const rounded = Math.round(val);
    return rounded > 0 ? `+${rounded}` : rounded.toString();
  };

  return (
    <div className="nothing-card p-6 h-full flex flex-col justify-between hover:border-[var(--text-secondary)] transition-all">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
          <span className="text-label text-[var(--text-secondary)]">ESTADO DE APTITUD (TSB)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 pr-4 border-r border-[var(--border-visible)]">
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Aptitud (CTL)</span>
                <span className="text-[12px] font-mono text-[var(--text-primary)]">{Math.round(ctl || 0)}</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-[8px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Fatiga (ATL)</span>
                <span className="text-[12px] font-mono text-[var(--text-primary)]">{Math.round(atl || 0)}</span>
             </div>
          </div>
          <div className="flex flex-col items-end pl-1">
             <span className="text-[8px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Estado (TSB)</span>
             <span className="text-[12px] font-mono text-[var(--text-primary)] font-bold">{formatTsb(tsb)} PTS</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[12px] bg-[var(--surface)] border border-[var(--border-visible)] flex items-center justify-center" style={{ color: status.color }}>
            {status.icon}
          </div>
          <div>
            <h3 className="text-[20px] font-bold uppercase tracking-tight text-[var(--text-primary)]">
              {status.label}
            </h3>
            <p className="text-[12px] text-[var(--text-disabled)] font-mono uppercase tracking-widest leading-none mt-1">
              {status.desc}
            </p>
          </div>
        </div>

        {/* Status Bar Indicator */}
        <div className="space-y-3">
           <div className="flex gap-1.5 h-2">
             {zones.map((z, i) => (
               <div 
                 key={z}
                 className={`flex-1 rounded-full transition-all duration-500 ${
                   i === status.index ? "opacity-100 scale-y-125" : "opacity-20 scale-y-100"
                 }`}
                 style={{ backgroundColor: i === status.index ? status.color : 'var(--text-disabled)' }}
               />
             ))}
           </div>
           <div className="flex justify-between">
              <span className="text-[8px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Recuperación</span>
              <span className="text-[8px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Sobreentrenamiento</span>
           </div>
        </div>
      </div>
    </div>
  );
}
