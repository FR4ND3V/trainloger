"use client";

import type { Activity } from "@/app/types";
import { Bike, Footprints, Waves } from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
}

const sportConfig = {
  Run: {
    icon: Footprints,
    label: "RUNNING",
    status: "success",
  },
  Swim: {
    icon: Waves,
    label: "SWIMMING",
    status: "interactive",
  },
  Ride: {
    icon: Bike,
    label: "CYCLING",
    status: "warning",
  },
  Other: {
    icon: Footprints,
    label: "OTHER",
    status: "neutral",
  },
};

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} KM`;
  }
  return `${Math.round(meters)} M`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);
  if (h > 0) return `${h}H ${m.toString().padStart(2, "0")}M`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).toUpperCase();
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const config = sportConfig[activity.type] || sportConfig.Other;
  const Icon = config.icon;

  return (
    <div
      className="group flex flex-col md:flex-row md:items-center gap-4 md:gap-6 px-5 py-4 border-b border-[var(--border)]
        bg-transparent transition-all duration-200 hover:bg-[var(--surface)]"
    >
      {/* Sport Indicator & Basic Info */}
      <div className="flex items-center gap-4 min-w-[200px]">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[var(--border-visible)]`}>
          <Icon className="h-5 w-5 text-[var(--text-primary)]" strokeWidth={1.5} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-label text-[10px] text-[var(--text-disabled)]">{config.label}</span>
            <span className="text-[10px] font-mono text-[var(--text-disabled)]">•</span>
            <span className="text-[10px] font-mono text-[var(--text-disabled)]">{formatDate(activity.date)}</span>
          </div>
          <h4 className="truncate font-sans text-[15px] font-bold tracking-tight text-[var(--text-display)] mt-0.5 uppercase">
            {activity.name}
          </h4>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-8 md:gap-12 md:flex-1 md:justify-end">
        <div>
          <p className="text-label text-[9px] text-[var(--text-disabled)]">DISTANCIA</p>
          <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
            {formatDistance(activity.distance)}
          </p>
        </div>
        <div>
          <p className="text-label text-[9px] text-[var(--text-disabled)]">DURACIÓN</p>
          <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
            {formatDuration(activity.duration)}
          </p>
        </div>
        
        {activity.pace && (
          <div>
            <p className="text-label text-[9px] text-[var(--text-disabled)]">RITMO</p>
            <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
              {activity.pace.toUpperCase()}
            </p>
          </div>
        )}

        {activity.avgHR && (
          <div className="hidden sm:block">
            <p className="text-label text-[9px] text-[var(--text-disabled)]">BPM</p>
            <p className="font-mono text-[14px] font-bold text-[var(--accent)] mt-0.5">
              {activity.avgHR}
            </p>
          </div>
        )}

        {/* Technical Status Tag */}
        <div className="hidden lg:block ml-4">
          <span className="inline-block border border-[var(--border-visible)] px-3 py-1 rounded-[4px] text-[9px] font-mono text-[var(--text-secondary)] uppercase">
            [ RECORDED ]
          </span>
        </div>
      </div>
    </div>
  );
}

