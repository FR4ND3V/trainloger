"use client";

import type { CoachAnalysis } from "@/app/types";
import { Brain } from "lucide-react";

interface CoachPanelProps {
  analysis: CoachAnalysis | null;
  loading?: boolean;
}

const statusColorMap: Record<string, string> = {
  peak: "var(--success)",
  optimal: "var(--interactive)",
  neutral: "var(--text-disabled)",
  fatigued: "var(--warning)",
  critical: "var(--accent)",
};

export default function CoachPanel({ analysis, loading }: CoachPanelProps) {
  if (loading) {
    return (
      <div className="nothing-card p-12 flex flex-col items-center justify-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center border border-[var(--border-visible)] animate-spin-mechanical rounded-full">
          <Brain className="h-5 w-5 text-[var(--text-disabled)]" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-label text-[11px] text-[var(--accent)] animate-pulse">
            [ LOADING ANALYSIS ]
          </span>
          <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-[0.2em]">
            FETCHING INTERVALS DATA // 0xAF...
          </span>
        </div>
      </div>
    );
  }


  if (!analysis) return null;

  const statusColor = statusColorMap[analysis.status] || statusColorMap.neutral;

  return (
    <div className="nothing-card relative overflow-hidden">
      {/* Decorative dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-[0.05] pointer-events-none" />

      <div className="relative p-8">
        {/* Header: Layer 1 (Metadata) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--border-visible)] bg-black">
              <Brain className="h-5 w-5 text-[var(--text-primary)]" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-label text-[10px] text-[var(--text-secondary)]">COACH IA</span>
              <span className="text-[9px] font-mono text-[var(--accent)] mt-0.5 tracking-[0.1em] font-bold">LIVE ANALYSIS</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">Estado</span>
             <span className="inline-block border border-[var(--border-visible)] px-3 py-1 rounded-[4px] text-[10px] font-mono text-[var(--text-display)] uppercase bg-black">
               [ {analysis.status} ]
             </span>
          </div>
        </div>

        {/* Content: Layer 2 (Display) & Layer 3 (Body) */}
        <div className="mt-8 flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center text-[32px] border border-[var(--border-visible)] bg-black rounded-[12px]">
            {analysis.emoji}
          </div>
          
          <div className="flex flex-col gap-3">
            <h3 className="text-[24px] font-sans font-bold tracking-tight text-[var(--text-display)] uppercase">
              {analysis.title}
            </h3>
            <p className="max-w-3xl text-[14px] leading-relaxed text-[var(--text-secondary)] font-sans tracking-tight">
              {analysis.message}
            </p>
          </div>
        </div>

        {/* Technical Footer decorator */}
        <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-between items-center">
            <div className="flex gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`h-1 w-2 ${i < 4 ? 'bg-[var(--accent)]' : 'bg-[var(--border-visible)]'}`} />
                ))}
            </div>
            <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase">Systems Nominal // 0xAF42</span>
        </div>
      </div>
    </div>
  );
}

