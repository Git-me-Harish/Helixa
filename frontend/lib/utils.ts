import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function vitalStatus(metric: string, value: number | null): "normal" | "warning" | "critical" | "unknown" {
  if (value === null) return "unknown";
  const ranges: Record<string, [number, number, number, number]> = {
    bp_systolic:  [70,  90,  120, 180],
    bp_diastolic: [40,  60,  80,  120],
    heart_rate:   [40,  60,  100, 150],
    glucose_mmol: [2.0, 3.9, 7.8, 15.0],
    spo2_pct:     [80,  95,  100, 100],
    temp_celsius: [34,  36.1, 37.2, 40],
  };
  const range = ranges[metric];
  if (!range) return "unknown";
  const [critLow, warnLow, warnHigh, critHigh] = range;
  if (value < critLow || value > critHigh) return "critical";
  if (value < warnLow || value > warnHigh) return "warning";
  return "normal";
}

export function vitalStatusColors(status: "normal" | "warning" | "critical" | "unknown") {
  const map = {
    normal:   { text:"#059669", bg:"#ecfdf5", border:"#a7f3d0" },
    warning:  { text:"#d97706", bg:"#fffbeb", border:"#fde68a" },
    critical: { text:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
    unknown:  { text:"#94a3b8", bg:"#f8fafc", border:"#e2e8f0" },
  };
  return map[status];
}

export function severityColor(severity: string): { text:string; bg:string; border:string } {
  const map: Record<string, { text:string; bg:string; border:string }> = {
    mild:             { text:"#d97706", bg:"#fffbeb", border:"#fde68a" },
    moderate:         { text:"#f59e0b", bg:"#fef3c7", border:"#fde68a" },
    severe:           { text:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
    life_threatening: { text:"#991b1b", bg:"#fef2f2", border:"#fca5a5" },
  };
  return map[severity] ?? { text:"#94a3b8", bg:"#f8fafc", border:"#e2e8f0" };
}

export function statusColor(status: string): { text:string; bg:string; border:string } {
  const map: Record<string, { text:string; bg:string; border:string }> = {
    active:    { text:"#059669", bg:"#ecfdf5", border:"#a7f3d0" },
    resolved:  { text:"#64748b", bg:"#f8fafc", border:"#e2e8f0" },
    chronic:   { text:"#d97706", bg:"#fffbeb", border:"#fde68a" },
    remission: { text:"#0d9488", bg:"#ccfbf1", border:"#99f6e4" },
    pending:   { text:"#d97706", bg:"#fffbeb", border:"#fde68a" },
    confirmed: { text:"#2563eb", bg:"#eff6ff", border:"#bfdbfe" },
    completed: { text:"#059669", bg:"#ecfdf5", border:"#a7f3d0" },
    cancelled: { text:"#dc2626", bg:"#fef2f2", border:"#fecaca" },
  };
  return map[status] ?? { text:"#94a3b8", bg:"#f8fafc", border:"#e2e8f0" };
}
