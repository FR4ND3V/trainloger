"use client";

import { type ReactNode } from "react";
import SegmentedProgressBar from "./SegmentedProgressBar";

interface MetricCardProps {
  title: string;
  value: string | number | null;
  unit?: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  status?: "success" | "warning" | "error" | "neutral" | "accent";
  size?: "default" | "large";
  progress?: number;
  maxProgress?: number;
}

export default function MetricCard({
  title,
  value,
  unit,
  subtitle,
  icon,
  trend,
  status = "neutral",
  size = "default",
  progress,
  maxProgress,
}: MetricCardProps) {
  const displayValue = value !== null && value !== undefined ? value : "—";

  const trendIcon =
    trend === "up" ? "↑" : trend === "down" ? "↓" : trend === "neutral" ? "→" : null;

  const getStatusColor = () => {
    switch (status) {
      case "success": return "text-[var(--success)]";
      case "warning": return "text-[var(--warning)]";
      case "error":
      case "accent": return "text-[var(--accent)]";
      default: return "text-[var(--text-display)]";
    }
  };

  return (
    <div
      className={`nothing-card relative flex flex-col gap-6 ${
        size === "large" ? "p-8" : "p-6"
      } hover:border-[var(--text-secondary)]`}
    >
      {/* Three-Layer Hierarchy: Metadata (Label) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-[var(--text-secondary)]">
            {icon}
          </div>
          <span className="text-label text-[var(--text-secondary)]">
            {title}
          </span>
        </div>
        
        {trendIcon && (
          <span className={`font-mono text-[13px] ${getStatusColor()}`}>
            {trendIcon}
          </span>
        )}
      </div>

      {/* Layer 2: Display (Hero Metric) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span
            className={`font-display text-[var(--text-display)] leading-none ${
              size === "large" ? "text-[56px] tracking-tight" : "text-[42px] tracking-tight"
            }`}
          >
            {displayValue}
          </span>
          {unit && (
            <span className="text-label text-[var(--text-disabled)] mb-1">
              {unit}
            </span>
          )}
        </div>
        
        {/* Layer 3: Body (Description/Subtitle) */}
        {subtitle && (
          <p className="text-[13px] font-sans text-[var(--text-secondary)] tracking-tight">
            {subtitle}
          </p>
        )}
      </div>

      {/* Optional Data Viz: Segmented Progress Bar */}
      {(progress !== undefined && maxProgress !== undefined) && (
        <div className="mt-2">
          <SegmentedProgressBar 
            value={progress} 
            max={maxProgress} 
            status={status} 
            size={size === "large" ? "standard" : "compact"}
          />
        </div>
      )}

      {/* Status indicator (Dot) */}
      {status !== "neutral" && (
        <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-current" style={{ color: `var(--${status === 'error' ? 'accent' : status})` }} />
      )}
    </div>
  );
}

