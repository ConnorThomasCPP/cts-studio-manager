import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  available: {
    bg: "bg-status-active/10",
    text: "text-status-active",
    dot: "bg-status-active"
  },
  checked_out: {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning"
  },
  "checked-out": {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning"
  },
  maintenance: {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning"
  },
  missing: {
    bg: "bg-status-error/10",
    text: "text-status-error",
    dot: "bg-status-error"
  },
  active: {
    bg: "bg-status-active/10",
    text: "text-status-active",
    dot: "bg-status-active animate-pulse"
  },
  planned: {
    bg: "bg-status-info/10",
    text: "text-status-info",
    dot: "bg-status-info"
  },
  "in-progress": {
    bg: "bg-status-active/10",
    text: "text-status-active",
    dot: "bg-status-active animate-pulse"
  },
  completed: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground"
  },
  cancelled: {
    bg: "bg-status-error/10",
    text: "text-status-error",
    dot: "bg-status-error"
  },
  "check-out": {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning"
  },
  check_out: {
    bg: "bg-status-warning/10",
    text: "text-status-warning",
    dot: "bg-status-warning"
  },
  "check-in": {
    bg: "bg-status-active/10",
    text: "text-status-active",
    dot: "bg-status-active"
  },
  check_in: {
    bg: "bg-status-active/10",
    text: "text-status-active",
    dot: "bg-status-active"
  },
  scan: {
    bg: "bg-status-info/10",
    text: "text-status-info",
    dot: "bg-status-info"
  },
  transfer: {
    bg: "bg-role-admin/10",
    text: "text-role-admin",
    dot: "bg-role-admin"
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/ /g, "-");
  const config = statusConfig[normalizedStatus] || statusConfig.available;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {status.replace(/_/g, " ").replace(/-/g, " ")}
    </span>
  );
}
