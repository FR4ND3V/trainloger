"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  LayoutDashboard, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  Circle
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { signOut } from "@/app/login/actions";
import ThemeToggle from "./ThemeToggle";
import { useSidebar } from "./SidebarContext";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Activities", href: "/activities", icon: Activity },
  { name: "Trends", href: "/trends", icon: TrendingUp },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null>(null);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const supabase = createClient();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  if (pathname === "/login") return null;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 z-50 hidden md:flex flex-col bg-[var(--black)] border-r border-[var(--border-visible)] transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo Section */}
        <div className="h-24 flex items-center px-6 border-b border-[var(--border-visible)] mb-8">
          <Link href="/" className="flex items-center gap-4 group overflow-hidden">
            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-[8px] bg-[var(--surface-raised)] border border-[var(--border-visible)] group-hover:border-[var(--accent)] transition-colors">
              <Activity className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.5} />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[var(--text-display)] uppercase font-mono whitespace-nowrap">
                  TRAINLOGGER
                </span>
                <span className="text-[8px] text-[var(--text-disabled)] tracking-widest font-mono">
                  v2.4.0 // STABLE
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-[12px] transition-all duration-200 group ${
                  isActive 
                    ? "bg-[var(--surface-raised)] border border-[var(--border-visible)] text-[var(--text-display)]" 
                    : "text-[var(--text-disabled)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]/50"
                }`}
              >
                <item.icon 
                  strokeWidth={1.5} 
                  className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-[var(--accent)]" : "group-hover:text-[var(--text-primary)]"}`} 
                />
                {!isCollapsed && (
                  <span className="text-[11px] font-mono uppercase tracking-[0.1em] overflow-hidden whitespace-nowrap">
                    {item.name}
                  </span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto">
                    <Circle className="h-1 w-1 fill-[var(--accent)] text-[var(--accent)]" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section: User & Status */}
        <div className="p-4 space-y-4 border-t border-[var(--border-visible)]">
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-[var(--border-visible)] bg-[var(--surface)]/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
              </span>
              <span className="text-[9px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">
                SYSTEM ACTIVE
              </span>
            </div>
          )}

          <div className={`flex flex-col gap-2 ${isCollapsed ? "items-center" : ""}`}>
             <div className={`flex items-center gap-3 ${isCollapsed ? "flex-col" : "justify-between"}`}>
                <ThemeToggle />
                {!isCollapsed && (
                   <button 
                     onClick={() => setIsCollapsed(true)}
                     className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
                   >
                     <ChevronLeft className="h-4 w-4" />
                   </button>
                )}
                {isCollapsed && (
                   <button 
                     onClick={() => setIsCollapsed(false)}
                     className="p-2 rounded-lg hover:bg-[var(--surface)] text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
                   >
                     <ChevronRight className="h-4 w-4" />
                   </button>
                )}
             </div>

             {user && (
               <div className={`flex items-center gap-3 p-3 rounded-[12px] bg-[var(--surface-raised)] border border-[var(--border-visible)] ${
                 isCollapsed ? "flex-col" : ""
               }`}>
                 {!isCollapsed ? (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-[var(--text-primary)] truncate">
                          {user.email?.split('@')[0]}
                        </p>
                        <p className="text-[8px] font-mono text-[var(--text-disabled)] uppercase tracking-widest">
                          ATHLETE ACCOUNT
                        </p>
                      </div>
                      <button 
                        onClick={() => signOut()}
                        className="p-2 text-[var(--text-disabled)] hover:text-[var(--error)] transition-colors"
                        title="Logout"
                      >
                        <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </>
                 ) : (
                    <button 
                      onClick={() => signOut()}
                      className="p-1 text-[var(--text-disabled)] hover:text-[var(--error)] transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                 )}
               </div>
             )}
          </div>
        </div>
      </aside>

      {/* Mobile Tab Bar - Remains as is but slightly more polished */}
      <nav className="fixed bottom-6 left-6 right-6 z-50 block md:hidden">
        <div className="nothing-card flex h-16 items-center justify-around px-4 bg-black/80 backdrop-blur-xl border border-[var(--border-visible)] shadow-2xl">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-[12px] transition-all duration-300 ${
                  isActive ? "bg-[var(--surface-raised)] text-[var(--accent)]" : "text-[var(--text-disabled)]"
                }`}
              >
                <item.icon strokeWidth={1.5} className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
