import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorageState } from "../utils/helpers";
import { PLANS, DEFAULT_NS } from "../data/plans";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [auth, setAuth] = useLocalStorageState("wpsaas.auth", { user: null });

  const [server, setServer] = useLocalStorageState("wpsaas.server", {
    domain: "",
    planId: "basic",
    status: "none", // none | awaiting_payment | awaiting_dns | live
    createdAt: null,
    wpAdminUrl: "",
    siteUrl: "",
    lastPayment: null,
    registrar: "OVH",
    analytics: { visitors7d: 0, uptime30d: 99.9, lastChecked: null },
  });

  // Server “scopé” par utilisateur
  useEffect(() => {
    if (!auth.user) return;
    const key = `wpsaas.server.${auth.user.email}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setServer(JSON.parse(raw));
      else localStorage.setItem(key, JSON.stringify(server));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.email]);

  useEffect(() => {
    if (!auth.user) return;
    const key = `wpsaas.server.${auth.user.email}`;
    try {
      localStorage.setItem(key, JSON.stringify(server));
    } catch {}
  }, [auth.user, server]);

  const value = useMemo(
    () => ({
      auth,
      setAuth,
      server,
      setServer,
      plans: PLANS,
      nameservers: DEFAULT_NS,
    }),
    [auth, server]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppContext missing");
  return ctx;
}
