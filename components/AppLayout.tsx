"use client";

import { useEffect, useState } from "react";
import { Menu, User, Users, LogOut, Settings, Building2, Check, Plus, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
  currentAccount?: {
    id: string;
    name: string;
  };
  currentAccountTheme?: string;
  accounts?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export function AppLayout({ children, user, currentAccount, currentAccountTheme = "studio-default", accounts = [] }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [createAccountError, setCreateAccountError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSwitchAccount = async (accountId: string) => {
    if (accountId === currentAccount?.id) return;

    setSwitchingAccountId(accountId);
    try {
      const response = await fetch("/api/accounts/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (!response.ok) {
        throw new Error("Failed to switch account");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to switch account:", error);
    } finally {
      setSwitchingAccountId(null);
    }
  };

  const handleCreateAccount = async () => {
    const name = newAccountName.trim();
    if (!name) {
      setCreateAccountError("Account name is required");
      return;
    }

    setCreatingAccount(true);
    setCreateAccountError(null);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setCreateAccountOpen(false);
      setNewAccountName("");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create account";
      setCreateAccountError(message);
    } finally {
      setCreatingAccount(false);
    }
  };

  const userInitials = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  const displayPhotoUrl = user?.photo_url || (user?.email ? getGravatarUrl(user.email) : null);

  useEffect(() => {
    document.documentElement.setAttribute("data-account-theme", currentAccountTheme);
  }, [currentAccountTheme]);

  return (
    <div
      className="min-h-screen bg-background"
      data-account-theme={currentAccountTheme}
    >
      <AppSidebar
        collapsed={collapsed}
        userRole={user?.role}
        accountName={currentAccount?.name}
        onToggle={() => setCollapsed(!collapsed)}
      />
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
                  {currentAccount?.name || "Workspace"} • {user.role || "viewer"}
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
              {accounts.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    Accounts
                  </DropdownMenuLabel>
                  {accounts.map((account) => (
                    <DropdownMenuItem
                      key={account.id}
                      onClick={() => handleSwitchAccount(account.id)}
                      disabled={switchingAccountId !== null}
                      className="cursor-pointer"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="flex-1">{account.name}</span>
                      {currentAccount?.id === account.id && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      setCreateAccountError(null);
                      setCreateAccountOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Account
                  </DropdownMenuItem>
                </>
              )}
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

      <Dialog
        open={createAccountOpen}
        onOpenChange={(open) => {
          setCreateAccountOpen(open);
          if (!open) {
            setCreateAccountError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Create an additional workspace and switch to it immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              placeholder="Account name"
              value={newAccountName}
              onChange={(event) => setNewAccountName(event.target.value)}
              disabled={creatingAccount}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateAccount();
                }
              }}
            />
            {createAccountError && (
              <p className="text-sm text-destructive">{createAccountError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateAccountOpen(false)}
              disabled={creatingAccount}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateAccount} disabled={creatingAccount}>
              {creatingAccount ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {switchingAccountId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-card-foreground shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Switching account...</span>
          </div>
        </div>
      )}

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
