import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, change, className }: StatCardProps) {
  return (
    <div className={cn(
      "stat-card-gradient rounded-xl border border-border p-5",
      "transition-all hover:border-primary/20 hover:glow-primary",
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground font-mono">
        {value}
      </p>
      {change && (
        <p className="mt-1 text-xs text-status-active">{change}</p>
      )}
    </div>
  );
}
