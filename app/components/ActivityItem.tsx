"use client";

import type { Activity } from "@/app/types";
import { Bike, Footprints, Waves, Activity as ActivityIcon, ChevronRight, Zap, Mountain } from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
  onClick?: (activity: Activity) => void;
}

const sportConfig: Record<string, { icon: any; label: string; accentVar: string }> = {
  Run: { icon: Footprints, label: "RUNNING", accentVar: "var(--success)" },
  Swim: { icon: Waves, label: "SWIMMING", accentVar: "var(--interactive)" },
  Ride: { icon: Bike, label: "CYCLING", accentVar: "var(--warning)" },
  Core: { icon: ActivityIcon, label: "CORE / PILATES", accentVar: "var(--text-secondary)" },
  Strength: { icon: ActivityIcon, label: "STRENGTH", accentVar: "var(--text-secondary)" },
  Other: { icon: Footprints, label: "OTHER", accentVar: "var(--text-disabled)" },
};

function formatDistance(meters: number, type: string): string {
  if (type === "Swim") return `${Math.round(meters)} M`;
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} KM`;
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
  return new Date(dateStr)
    .toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();
}

export default function ActivityItem({ activity, onClick }: ActivityItemProps) {
  const config = sportConfig[activity.type] || sportConfig.Other;
  const Icon = config.icon;

  return (
    <div
      onClick={() => onClick?.(activity)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(activity)}
      className={`group flex flex-col md:flex-row md:items-center gap-4 md:gap-6 px-5 py-4
        border-b border-[var(--border)] bg-transparent
        transition-all duration-200
        hover:bg-[var(--surface)] hover:border-[var(--border-visible)]
        ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Sport Icon + Info */}
      <div className="flex items-center gap-4 min-w-[210px]">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[var(--border-visible)]
            transition-all duration-200 group-hover:border-[var(--text-disabled)]"
          style={{ borderColor: `${config.accentVar}44` }}
        >
          <Icon className="h-5 w-5" style={{ color: config.accentVar }} strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-label text-[10px]" style={{ color: config.accentVar }}>
              {config.label}
            </span>
            <span className="text-[10px] font-mono text-[var(--text-disabled)]">•</span>
            <span className="text-[10px] font-mono text-[var(--text-disabled)]">{formatDate(activity.date)}</span>
          </div>
          <h4 className="truncate font-sans text-[15px] font-bold tracking-tight text-[var(--text-display)] mt-0.5 uppercase">
            {activity.name}
          </h4>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="flex flex-wrap items-center gap-6 md:gap-10 md:flex-1 md:justify-end">
        {/* Distance */}
        <div>
          <p className="text-label text-[9px] text-[var(--text-disabled)]">DISTANCIA</p>
          <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
            {formatDistance(activity.distance, activity.type)}
          </p>
        </div>

        {/* Duration */}
        <div>
          <p className="text-label text-[9px] text-[var(--text-disabled)]">DURACIÓN</p>
          <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
            {formatDuration(activity.duration)}
          </p>
        </div>

        {/* Sport-specific primary metric */}
        {activity.type === "Run" && activity.pace && (
          <div>
            <p className="text-label text-[9px] text-[var(--text-disabled)]">RITMO</p>
            <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
              {activity.pace}
            </p>
          </div>
        )}
        {activity.type === "Swim" && activity.swimPace && (
          <div>
            <p className="text-label text-[9px] text-[var(--text-disabled)]">RITMO</p>
            <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
              {activity.swimPace}
            </p>
          </div>
        )}
        {activity.type === "Ride" && activity.avgSpeed != null && (
          <div>
            <p className="text-label text-[9px] text-[var(--text-disabled)]">VELOCIDAD</p>
            <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
              {activity.avgSpeed.toFixed(1)} km/h
            </p>
          </div>
        )}

        {/* Cycling power */}
        {activity.type === "Ride" && activity.avgPower != null && (
          <div className="hidden sm:block">
            <p className="text-label text-[9px] text-[var(--text-disabled)]">POTENCIA</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="h-3 w-3" style={{ color: "var(--warning)" }} strokeWidth={1.5} />
              <p className="font-mono text-[14px] font-bold" style={{ color: "var(--warning)" }}>
                {activity.avgPower}W
              </p>
            </div>
          </div>
        )}

        {/* Elevation (Ride / Run) */}
        {(activity.type === "Ride" || activity.type === "Run") && activity.elevationGain != null && (
          <div className="hidden lg:block">
            <p className="text-label text-[9px] text-[var(--text-disabled)]">DESNIVEL</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Mountain className="h-3 w-3 text-[var(--text-disabled)]" strokeWidth={1.5} />
              <p className="font-mono text-[14px] font-bold text-[var(--text-primary)]">
                +{Math.round(activity.elevationGain)}m
              </p>
            </div>
          </div>
        )}

        {/* HR */}
        {activity.avgHR && (
          <div className="hidden sm:block">
            <p className="text-label text-[9px] text-[var(--text-disabled)]">FC MEDIA</p>
            <p className="font-mono text-[14px] font-bold mt-0.5" style={{ color: "var(--accent)" }}>
              {activity.avgHR} BPM
            </p>
          </div>
        )}

        {/* Swim SWOLF */}
        {activity.type === "Swim" && activity.swolf != null && (
          <div className="hidden sm:block">
            <p className="text-label text-[9px] text-[var(--text-disabled)]">SWOLF</p>
            <p className="font-mono text-[14px] font-bold text-[var(--text-primary)] mt-0.5">
              {activity.swolf}
            </p>
          </div>
        )}

        {/* Chevron arrow for clickable */}
        {onClick && (
          <div className="hidden lg:flex items-center gap-3 ml-2">
            <span className="inline-block border border-[var(--border-visible)] px-3 py-1 rounded-[4px] text-[9px] font-mono text-[var(--text-secondary)] uppercase">
              [ VER DETALLE ]
            </span>
            <ChevronRight
              className="h-4 w-4 text-[var(--text-disabled)] transition-transform duration-200 group-hover:translate-x-1"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
    </div>
  );
}
