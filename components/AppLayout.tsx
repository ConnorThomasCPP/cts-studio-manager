"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar, MobileNav } from "./AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} user={user} />
      <MobileNav />

      {/* Header bar */}
      <header
        className={`sticky top-0 z-30 flex h-16 items-center border-b border-border bg-background/80 backdrop-blur-sm px-4 transition-all duration-300 ${
          collapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Main content */}
      <main
        className={`transition-all duration-300 pb-20 md:pb-8 ${
          collapsed ? "md:pl-16" : "md:pl-60"
        }`}
      >
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
