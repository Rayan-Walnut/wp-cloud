import React from "react";
import { cn } from "../../utils/helpers";

export function Card({ children, className }) {
  return <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, icon: Icon, right }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div>
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
