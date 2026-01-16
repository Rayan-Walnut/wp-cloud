import { useEffect, useState } from "react";

export const cn = (...classes) => classes.filter(Boolean).join(" ");

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState];
}

export function formatEUR(amount) {
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  } catch {
    return `${amount} €`;
  }
}

export function isValidDomain(value) {
  const v = String(value || "").trim().toLowerCase();
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(v) && !v.startsWith("-") && !v.endsWith("-");
}

export function toastCopy(text) {
  const id = "toast-copy";
  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.id = id;
  el.className =
    "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

export async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
    toastCopy("Copié ✅");
  } catch {
    toastCopy("Impossible de copier");
  }
}
