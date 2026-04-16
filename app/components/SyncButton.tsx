"use client";

import { RefreshCw, Check, AlertCircle } from "lucide-react";

type SyncState = "idle" | "loading" | "success" | "error";

interface SyncButtonProps {
  state: SyncState;
  onClick: () => void;
  lastSync?: string | null;
}

export default function SyncButton({ state, onClick, lastSync }: SyncButtonProps) {
  const isLoading = state === "loading";

  return (
    <div className="flex items-center gap-4">
      {lastSync && (
        <span className="hidden font-mono text-[10px] text-[var(--text-disabled)] uppercase tracking-wider sm:block">
          LAST SYNC:{" "}
          {new Date(lastSync).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      )}

      <button
        onClick={onClick}
        disabled={isLoading}
        className={`group relative btn-nothing disabled:opacity-30 disabled:cursor-not-allowed
          ${
            state === "error"
              ? "border border-[var(--accent)] text-[var(--accent)]"
              : state === "success"
                ? "border border-[var(--success)] text-[var(--success)]"
                : "btn-secondary"
          }`}
      >
        {state === "loading" && (
          <RefreshCw className="h-4 w-4 animate-spin-mechanical" strokeWidth={1.5} />
        )}
        {state === "success" && <Check className="h-4 w-4" strokeWidth={1.5} />}
        {state === "error" && <AlertCircle className="h-4 w-4" strokeWidth={1.5} />}
        {state === "idle" && (
          <RefreshCw className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" strokeWidth={1.5} />
        )}

        <span>

          {state === "loading"
            ? "[ SYNCING ]"
            : state === "success"
              ? "[ SYNCED ]"
              : state === "error"
                ? "[ ERROR ]"
                : "SYNC DATA"}
        </span>
      </button>
    </div>
  );
}

