import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/helpers";

export function Spinner({ className }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
  };
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
