import React from "react";

interface SegmentedProgressBarProps {
  value: number; // Current value
  max: number;   // Maximum value
  segments?: number; // Total number of segments (default 20)
  status?: "neutral" | "success" | "warning" | "error" | "accent";
  size?: "hero" | "standard" | "compact";
}

export default function SegmentedProgressBar({
  value,
  max,
  segments = 20,
  status = "neutral",
  size = "standard",
}: SegmentedProgressBarProps) {
  const percentage = Math.min(Math.max(value / max, 0), 1);
  const filledSegments = Math.round(percentage * segments);

  const getHeight = () => {
    switch (size) {
      case "hero": return "h-[16px]";
      case "compact": return "h-[4px]";
      default: return "h-[8px]";
    }
  };

  const getSegmentColor = () => {
    switch (status) {
      case "success": return "bg-[var(--success)]";
      case "warning": return "bg-[var(--warning)]";
      case "error":
      case "accent": return "bg-[var(--accent)]";
      default: return "bg-[var(--text-display)]";
    }
  };

  return (
    <div className="flex gap-[2px] w-full">
      {Array.from({ length: segments }).map((_, i) => {
        const isFilled = i < filledSegments;
        return (
          <div
            key={i}
            className={`flex-1 ${getHeight()} transition-colors duration-300 ${
              isFilled ? getSegmentColor() : "bg-[var(--border)]"
            } ${i === 0 ? "rounded-l-[2px]" : ""} ${i === segments - 1 ? "rounded-r-[2px]" : ""}`}
          />
        );
      })}
    </div>
  );
}
