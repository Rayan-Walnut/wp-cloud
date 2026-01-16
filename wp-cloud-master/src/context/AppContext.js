import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocalStorageState } from "../utils/helpers";
import { PLANS, DEFAULT_NS } from "../data/plans";
import api from "../services/api";

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
    nameservers: [],
    username: "",
    mysql_password: "",
    container_name: "",
  });

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

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

  // Charger l'installation depuis l'API au démarrage
  useEffect(() => {
    const loadInstallation = async () => {
      if (!auth.user) return;

      try {
        setLoading(true);
        const username = auth.user.email.split('@')[0];
        const response = await api.getInstallation(username);

        if (response.success && response.installation) {
          const inst = response.installation;
          setServer({
            domain: inst.domain || "",
            planId: "basic",
            status: inst.status === "active" ? "live" : "none",
            createdAt: inst.created_at || null,
            wpAdminUrl: `https://${inst.domain}/wp-admin`,
            siteUrl: `https://${inst.domain}`,
            lastPayment: inst.created_at || null,
            registrar: "Cloudflare",
            analytics: { visitors7d: 0, uptime30d: 99.9, lastChecked: null },
            nameservers: inst.nameservers || [],
            username: inst.username || "",
            mysql_password: inst.mysql_password || "",
            container_name: inst.container_name || "",
          });
        }
      } catch (error) {
        console.log("Aucune installation trouvée ou erreur API:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadInstallation();
  }, [auth.user?.email]);

  // Fonctions API
  const deployWordPress = async (domain, email) => {
    try {
      setLoading(true);
      setApiError(null);

      const username = auth.user.email.split('@')[0];

      const response = await api.deployWordPress({
        username,
        domain,
        email,
      });

      if (response.success) {
        const data = response.data;
        setServer({
          domain: data.domain,
          planId: "basic",
          status: "awaiting_dns",
          createdAt: data.created_at,
          wpAdminUrl: data.wp_admin_url,
          siteUrl: data.site_url,
          lastPayment: data.created_at,
          registrar: "Cloudflare",
          analytics: { visitors7d: 0, uptime30d: 99.9, lastChecked: null },
          nameservers: data.nameservers || [],
          username: data.username,
          mysql_password: data.mysql_password,
          container_name: data.container_name,
        });
        return response;
      }
    } catch (error) {
      setApiError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteInstallation = async () => {
    try {
      setLoading(true);
      setApiError(null);

      const username = auth.user.email.split('@')[0];
      await api.deleteInstallation(username);

      // Réinitialiser le serveur
      setServer({
        domain: "",
        planId: "basic",
        status: "none",
        createdAt: null,
        wpAdminUrl: "",
        siteUrl: "",
        lastPayment: null,
        registrar: "OVH",
        analytics: { visitors7d: 0, uptime30d: 99.9, lastChecked: null },
        nameservers: [],
        username: "",
        mysql_password: "",
        container_name: "",
      });
    } catch (error) {
      setApiError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshInstallation = async () => {
    try {
      setLoading(true);
      const username = auth.user.email.split('@')[0];
      const response = await api.getInstallation(username);

      if (response.success && response.installation) {
        const inst = response.installation;
        setServer((prev) => ({
          ...prev,
          domain: inst.domain || prev.domain,
          wpAdminUrl: `https://${inst.domain}/wp-admin`,
          siteUrl: `https://${inst.domain}`,
          nameservers: inst.nameservers || prev.nameservers,
          mysql_password: inst.mysql_password || prev.mysql_password,
        }));
      }
    } catch (error) {
      console.error("Erreur refresh:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      auth,
      setAuth,
      server,
      setServer,
      plans: PLANS,
      nameservers: DEFAULT_NS,
      loading,
      apiError,
      deployWordPress,
      deleteInstallation,
      refreshInstallation,
    }),
    [auth, server, loading, apiError]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppContext missing");
  return ctx;
}
