"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  LayoutDashboard,
  Package,
  CalendarClock,
  Users,
  UserCog,
  Music,
  ScanBarcode,
  ScrollText,
  Settings,
  Folder,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  to: string;
  icon: LucideIcon;
  label: string;
  submenu?: Array<{ to: string; icon?: LucideIcon; label: string }>;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
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
  {
    to: "/clients",
    icon: Users,
    label: "Clients",
    submenu: [
      { to: "/clients", icon: Users, label: "Clients" },
      { to: "/sessions", icon: CalendarClock, label: "Sessions" },
      { to: "/projects", icon: Folder, label: "Projects" },
      { to: "/tracks", icon: Music, label: "Tracks" },
    ],
  },
  {
    to: "/admin",
    icon: Settings,
    label: "Admin",
    adminOnly: true,
    submenu: [
      { to: "/admin", icon: Settings, label: "Admin Settings" },
      { to: "/users", icon: UserCog, label: "Team" },
      { to: "/transactions", icon: ScrollText, label: "Transactions" },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  userRole?: string;
  accountName?: string;
  onToggle?: () => void;
}

export function AppSidebar({ collapsed, userRole, accountName }: AppSidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || userRole === "admin");

  const cancelCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openFlyout = (itemToOpen: string) => {
    cancelCloseTimer();
    setHoveredItem(itemToOpen);
  };

  const scheduleFlyoutClose = () => {
    cancelCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 180);
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
              {accountName || "Studio Manager"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Studio Manager Pro
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.to || pathname?.startsWith(item.to + "/");
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isHovered = hoveredItem === item.to;
          const hasActiveSubItem = !!item.submenu?.some((subitem) => pathname === subitem.to || pathname?.startsWith(subitem.to + "/"));
          const isGroupActive = isActive || hasActiveSubItem;

          return (
            <div
              key={item.to}
              className="relative"
              onMouseEnter={() => hasSubmenu && openFlyout(item.to)}
              onMouseLeave={() => hasSubmenu && scheduleFlyoutClose()}
            >
              {hasSubmenu ? (
                <>
                  <Link
                    href={item.to}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isGroupActive
                        ? "bg-primary/10 text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      </>
                    )}
                  </Link>
                  {isHovered && (
                    <div
                      className={`absolute top-0 z-50 w-56 rounded-xl border border-sidebar-border bg-sidebar-background p-2 shadow-xl ${
                        collapsed ? "left-[3.5rem]" : "left-[14.8rem]"
                      }`}
                      onMouseEnter={cancelCloseTimer}
                      onMouseLeave={scheduleFlyoutClose}
                    >
                      <div className="mb-1 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {item.label}
                      </div>
                      <div className="space-y-1">
                        {item.submenu?.map((subitem) => {
                          const isSubActive = pathname === subitem.to || pathname?.startsWith(subitem.to + "/");
                          return (
                            <Link
                              key={subitem.to}
                              href={subitem.to}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
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
  const mobileItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/assets", icon: Package, label: "Assets" },
    { to: "/scan", icon: ScanBarcode, label: "Scanner" },
    { to: "/sessions", icon: CalendarClock, label: "Sessions" },
    { to: "/clients", icon: Users, label: "Clients" },
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
