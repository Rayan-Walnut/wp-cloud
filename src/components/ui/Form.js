import React from "react";
import { cn } from "../../utils/helpers";

export function Field({ label, hint, error, children }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-slate-900">{label}</label>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <div className="text-xs text-rose-600">{error}</div> : null}
    </div>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
