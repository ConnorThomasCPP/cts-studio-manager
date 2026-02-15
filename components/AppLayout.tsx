"use client";

import { useState } from "react";
import { Menu, User, Users, LogOut, Settings } from "lucide-react";
import { AppSidebar, MobileNav } from "./AppSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import md5 from "md5";

function getGravatarUrl(email: string, size: number = 200): string {
  const hash = md5(email.trim().toLowerCase());
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}

interface AppLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
    role?: string;
    photo_url?: string | null;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const userInitials = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  const displayPhotoUrl = user?.photo_url || (user?.email ? getGravatarUrl(user.email) : null);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <MobileNav />

      {/* Header bar */}
      <header
        className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 transition-all duration-300 ${
          collapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Profile dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-secondary transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {user.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role || "viewer"}
                </p>
              </div>
              <Avatar className="h-9 w-9">
                {displayPhotoUrl && <AvatarImage src={displayPhotoUrl} alt={user.name || user.email || "User"} />}
                <AvatarFallback className="text-sm">{userInitials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/calendar" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Calendar Settings
                </Link>
              </DropdownMenuItem>
              {user.role === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/users" className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    Team Management
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
