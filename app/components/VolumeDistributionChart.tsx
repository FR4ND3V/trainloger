"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import type { ChartDataEntry } from "@/app/types";

interface VolumeDistributionChartProps {
  data: ChartDataEntry[] | undefined;
}

// ─── Component: Custom Chart Tooltip ─────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  // Filter out entries with 0 value
  const activeEntries = payload.filter((entry: any) => entry.value > 0);

  if (activeEntries.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--border-visible)] bg-[var(--surface)]/95 p-4 backdrop-blur-md shadow-2xl">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-disabled)] font-mono">
        {new Date(label).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
      </p>
      <div className="space-y-1.5">
        {activeEntries.map((entry: any, index: number) => {
          let distanceStr = "";
          let durationStr = "";
          const mins = entry.value;

          // Format duration
          const h = Math.floor(mins / 60);
          const m = Math.round(mins % 60);
          if (h > 0) {
            durationStr = m > 0 ? `${h}h ${m}m` : `${h}h`;
          } else {
            durationStr = `${m} min`;
          }

          // Format distance by sport rules
          if (entry.dataKey === "swimDuration") {
            const distM = entry.payload.swimDistance || 0;
            distanceStr = `${new Intl.NumberFormat("es-ES").format(distM)} m`;
          } else if (entry.dataKey === "rideDuration") {
            const distKm = (entry.payload.rideDistance || 0) / 1000;
            distanceStr = `${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(distKm)} km`;
          } else if (entry.dataKey === "runDuration") {
            const distKm = (entry.payload.runDistance || 0) / 1000;
            distanceStr = `${new Intl.NumberFormat("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(distKm)} km`;
          }

          return (
            <div key={index} className="flex items-center justify-between gap-8">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-[var(--text-secondary)]">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)] font-mono">
                {distanceStr} ({durationStr})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function VolumeDistributionChart({ data }: VolumeDistributionChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-label text-[11px] text-[var(--text-disabled)] animate-pulse">
          [ LOADING CHART ]
        </span>
      </div>
    );
  }

  // Format Y-axis ticks in hours
  const formatYAxis = (value: number) => {
    if (value === 0) return "0";
    const hours = value / 60;
    if (hours % 1 === 0) {
      return `${hours}h`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          fontSize={10}
          tickFormatter={(str) => new Date(str).toLocaleDateString("es-ES", { day: 'numeric' })}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}
        />
        <YAxis
          fontSize={10}
          axisLine={false}
          tickLine={false}
          tickFormatter={formatYAxis}
          tick={{ fill: 'var(--text-disabled)', fontFamily: 'var(--font-mono)' }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
        {/* Render order from left to right: Natación (macOS Blue) -> Ciclismo (macOS Gold) -> Running (macOS Green) */}
        <Bar name="Natación" dataKey="swimDuration" fill="#007AFF" radius={[2, 2, 0, 0]} />
        <Bar name="Ciclismo" dataKey="rideDuration" fill="#FF9500" radius={[2, 2, 0, 0]} />
        <Bar name="Running" dataKey="runDuration" fill="#34C759" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
