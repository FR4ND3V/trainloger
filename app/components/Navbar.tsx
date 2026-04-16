"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  LayoutDashboard, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Settings 
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="fixed top-6 left-0 right-0 z-50 hidden md:block">
        <div className="mx-auto h-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="nothing-card flex h-full items-center justify-between px-6 shadow-none">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Activity className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.5} />
              <span className="text-sm font-bold tracking-[0.1em] text-[var(--text-display)] uppercase font-mono">
                AI PERFORMANCE
              </span>
            </Link>

            {/* Right Side: Status & Links */}
            <div className="flex items-center gap-8">
              {/* Status Indicator */}
              <div className="flex items-center gap-2.5 px-3 py-1 rounded-full border border-[var(--border-visible)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
                </span>
                <span className="text-[10px] text-label text-[var(--text-secondary)]">
                  API: CONNECTED
                </span>
              </div>

              {/* Nav Links */}
              <div className="flex items-center gap-2">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`font-mono text-[11px] tracking-[0.06em] uppercase px-3 py-2 transition-all duration-200 ${
                        isActive 
                          ? "text-[var(--text-display)]" 
                          : "text-[var(--text-disabled)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {isActive ? `[ ${item.name} ]` : item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Tab Bar (iOS Style) */}
      <nav className="fixed bottom-4 left-4 right-4 z-50 block md:hidden">
        <div className="nothing-card flex h-20 items-center justify-around px-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${
                  isActive ? "text-[var(--text-display)]" : "text-[var(--text-disabled)]"
                }`}
              >
                <div className={`p-2 rounded-[12px] ${
                  isActive ? "bg-[var(--surface-raised)] border border-[var(--border-visible)]" : ""
                }`}>
                  <item.icon 
                    strokeWidth={1.5}
                    className={`h-5 w-5 ${isActive ? "text-[var(--accent)]" : ""}`} 
                  />
                </div>
                <span className="text-label text-[9px] leading-none">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}


