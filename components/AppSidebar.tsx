"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  Users,
  Music,
  ScanBarcode,
  ScrollText,
  Settings,
  Folder,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  {
    to: "/assets",
    icon: Package,
    label: "Assets",
    submenu: [
      { to: "/assets", label: "All Assets" },
      { to: "/scan", icon: ScanBarcode, label: "Scanner" },
    ]
  },
  { to: "/sessions", icon: CalendarClock, label: "Sessions" },
  { to: "/clients", icon: Users, label: "Clients" },
  { to: "/projects", icon: Folder, label: "Projects" },
  { to: "/tracks", icon: Music, label: "Tracks" },
  { to: "/transactions", icon: ScrollText, label: "Transactions" },
  { to: "/admin", icon: Settings, label: "Settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(["/assets"]);

  const toggleExpanded = (to: string) => {
    setExpandedItems(prev =>
      prev.includes(to) ? prev.filter(item => item !== to) : [...prev, to]
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar-background transition-all duration-300 hidden md:flex flex-col ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Music className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">
              Studio Manager
            </span>
            <span className="text-[10px] text-muted-foreground">
              by Connor Thomas
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.to || pathname?.startsWith(item.to + "/");
          const isExpanded = expandedItems.includes(item.to);
          const hasSubmenu = item.submenu && item.submenu.length > 0;

          return (
            <div key={item.to}>
              {hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleExpanded(item.to)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                      </>
                    )}
                  </button>
                  {!collapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.submenu.map((subitem) => {
                        const isSubActive = pathname === subitem.to;
                        return (
                          <Link
                            key={subitem.to}
                            href={subitem.to}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                              isSubActive
                                ? "bg-primary/10 text-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            }`}
                          >
                            {subitem.icon && <subitem.icon className="h-4 w-4 shrink-0" />}
                            <span>{subitem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/* Mobile bottom nav */
export function MobileNav() {
  const pathname = usePathname();
  // Include Scanner in mobile nav by flattening submenu items
  const mobileItems = [
    navItems[0], // Dashboard
    navItems[1], // Assets
    { to: "/scan", icon: ScanBarcode, label: "Scanner" }, // Scanner from submenu
    navItems[2], // Sessions
    navItems[3], // Clients
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-sidebar-border bg-sidebar-background md:hidden">
      {mobileItems.map((item) => {
        const isActive = pathname === item.to;
        return (
          <Link
            key={item.to}
            href={item.to}
            className={`flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
