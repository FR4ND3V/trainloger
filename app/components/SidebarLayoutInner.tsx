"use client";

import React from "react";
import Sidebar from "./Sidebar";
import { useSidebar } from "./SidebarContext";

export default function SidebarLayoutInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main 
        className={`flex-1 w-full transition-all duration-300 ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
