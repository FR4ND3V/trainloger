"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="group relative flex items-center gap-3 px-3 py-1.5 rounded-full border border-[var(--border-visible)] hover:border-[var(--accent)] transition-all duration-300 overflow-hidden"
      title={`Cambiar a modo ${theme === "light" ? "oscuro" : "claro"}`}
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        {theme === "light" ? (
          <Sun className="h-3.5 w-3.5 text-[var(--accent)] animate-fade-in" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-[var(--interactive)] animate-fade-in" />
        )}
      </div>
      
      <div className="flex flex-col items-start min-w-[50px]">
        <span className="text-[9px] font-mono leading-none tracking-[0.2em] text-[var(--text-disabled)] uppercase">
          MODO
        </span>
        <span className="text-[10px] font-mono leading-none font-bold text-[var(--text-primary)] uppercase mt-0.5">
          {theme === "light" ? "LIGHT" : "DARK"}
        </span>
      </div>

      {/* Mechanical Hover Effect */}
      <div className="absolute inset-0 bg-[var(--accent)]/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
    </button>
  );
}
