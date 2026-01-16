import React from "react";
import { cn } from "../../utils/helpers";

export function Divider({ className }) {
  return <div className={cn("h-px w-full bg-slate-100", className)} />;
}

export function Pill({ children, tone = "slate" }) {
  const toneMap = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-red-50 text-red-800 border-red-200",
    blue: "bg-blue-50 text-blue-800 border-blue-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", toneMap[tone] || toneMap.slate)}>
      {children}
    </span>
  );
}
