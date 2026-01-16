import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Globe,
  LineChart,
  LifeBuoy,
  Wrench,
  ExternalLink,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Loader2,
  Server as ServerIcon,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Divider, Pill } from "../components/ui/Misc";
import { formatEUR, sleep, toastCopy } from "../utils/helpers";

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="text-slate-600">{label}</div>
      <div className="text-right font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-2 text-xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { auth, server, setServer, plans, deleteInstallation: apiDeleteInstallation, refreshInstallation, loading } = useApp();
  const nav = useNavigate();

  useEffect(() => {
    if (!auth.user) nav("/login", { replace: true });
  }, [auth.user, nav]);

  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const plan = useMemo(
    () => plans.find((p) => p.id === server.planId) || plans[0],
    [plans, server.planId]
  );

  const statusMeta =
    {
      none: { label: "Aucun site", tone: "slate", icon: ServerIcon },
      awaiting_payment: { label: "Paiement requis", tone: "amber", icon: CreditCard },
      awaiting_dns: { label: "En attente DNS", tone: "amber", icon: Loader2 },
      live: { label: "Site en ligne", tone: "emerald", icon: CheckCircle2 },
    }[server.status] || { label: "Inconnu", tone: "red", icon: ServerIcon };

  const StatusIcon = statusMeta.icon;

  const goPrimary = () => {
    if (server.status === "none") nav("/create");
    else if (server.status === "awaiting_payment") nav("/checkout");
    else if (server.status === "awaiting_dns") nav("/confirmation");
    else if (server.status === "live" && server.siteUrl) window.open(server.siteUrl, "_blank");
    else toastCopy("(Mock) Continuer…");
  };

  const primaryLabel =
    server.status === "none"
      ? "Créer mon site"
      : server.status === "awaiting_payment"
      ? "Payer"
      : server.status === "awaiting_dns"
      ? "Configurer le DNS"
      : "Ouvrir le site";

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      // Rafraîchir les données depuis l'API
      await refreshInstallation();

      // Mock analytics (à remplacer par de vraies données plus tard)
      const now = new Date().toISOString();
      setServer((prev) => ({
        ...prev,
        analytics: {
          visitors7d: Math.floor(50 + Math.random() * 900),
          uptime30d: 99.4 + Math.random() * 0.6,
          lastChecked: now,
        },
      }));
    } catch (error) {
      console.error("Erreur refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteInstallation = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre site WordPress ? Cette action est irréversible.")) {
      return;
    }

    try {
      setDeleting(true);
      await apiDeleteInstallation();
      alert("Site WordPress supprimé avec succès");
    } catch (error) {
      alert("Erreur lors de la suppression: " + error.message);
      console.error("Erreur suppression:", error);
    } finally {
      setDeleting(false);
    }
  };

  const statusPill = (
    <Pill tone={statusMeta.tone}>
      <span className="inline-flex items-center gap-2">
        <StatusIcon className={`h-3.5 w-3.5 ${server.status === "awaiting_dns" ? "animate-spin" : ""}`} />
        {statusMeta.label}
      </span>
    </Pill>
  );

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-600">Dashboard</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Bonjour, {auth.user?.name || ""}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
              {statusPill}
              <span className="text-slate-400">•</span>
              <span>
                Domaine : <span className="font-mono font-semibold">{server.domain || "—"}</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-semibold">
                {plan?.name || "—"}{" "}
                <span className="text-slate-500">({formatEUR(plan?.priceMonthly || 0)}/mo)</span>
              </span>
            </div>

            <div className="text-sm text-slate-600">
              Tout est en mode prototype : paiements Stripe via Payment Links, activation DNS simulée.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={goPrimary}>
              <ExternalLink className="h-4 w-4" /> {primaryLabel}
            </Button>

            <Button variant="secondary" onClick={() => nav("/support")}>
              <LifeBuoy className="h-4 w-4" /> Support
            </Button>

            <Button variant="secondary" loading={refreshing} onClick={refreshAnalytics}>
              <RefreshCw className="h-4 w-4" /> Actualiser
            </Button>
          </div>
        </div>
      </section>

      {/* Infos rapides */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="Votre site" subtitle="Informations principales" icon={Globe} right={statusPill} />
          <div className="p-5 space-y-3">
            <InfoRow label="Domaine" value={server.domain || "—"} />
            <InfoRow label="Site URL" value={server.siteUrl ? <span className="font-mono">{server.siteUrl}</span> : "—"} />
            <InfoRow
              label="Admin WordPress"
              value={server.wpAdminUrl ? <span className="font-mono">{server.wpAdminUrl}</span> : "—"}
            />

            <Divider />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={server.status !== "live" || !server.wpAdminUrl}
                onClick={() => window.open(server.wpAdminUrl, "_blank")}
              >
                <Wrench className="h-4 w-4" /> Admin WP
              </Button>

              <Button
                variant="secondary"
                disabled={!server.siteUrl}
                onClick={() => (server.siteUrl ? window.open(server.siteUrl, "_blank") : null)}
              >
                <Globe className="h-4 w-4" /> Ouvrir le site
              </Button>

              <Button variant="secondary" onClick={() => nav("/confirmation")}>
                DNS / Nameservers
              </Button>

              <Button variant="secondary" onClick={() => nav("/billing")}>
                Facturation
              </Button>
            </div>

            <div className="text-xs text-slate-500">
              (Le provisioning WordPress + vérification DNS seront automatisés via backend/webhooks plus tard.)
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Abonnement" subtitle="Résumé" icon={CreditCard} />
          <div className="p-5 space-y-3 text-sm text-slate-700">
            <InfoRow
              label="Dernier paiement"
              value={server.lastPayment ? new Date(server.lastPayment).toLocaleString("fr-FR") : "—"}
            />
            <InfoRow label="Renouvellement" value={server.lastPayment ? "Mensuel" : "—"} />
            <Divider />
            <Button className="w-full" variant="secondary" onClick={() => nav("/pricing")}>
              <CreditCard className="h-4 w-4" /> Voir les plans
            </Button>
            <Button className="w-full" variant="ghost" onClick={() => nav("/billing")}>
              Gérer la facturation
            </Button>
          </div>
        </Card>
      </section>

      {/* Analytics */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-3">
          <CardHeader title="Analytics basiques" subtitle="Mock" icon={LineChart} />
          <div className="p-5 grid gap-3 md:grid-cols-3">
            <StatTile label="Visiteurs (7j)" value={server.analytics?.visitors7d ?? 0} />
            <StatTile label="Uptime (30j)" value={`${(server.analytics?.uptime30d ?? 0).toFixed(2)}%`} />
            <StatTile
              label="Dernier check"
              value={server.analytics?.lastChecked ? new Date(server.analytics.lastChecked).toLocaleString("fr-FR") : "—"}
            />
          </div>
        </Card>
      </section>

      {/* Danger zone */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="À propos" subtitle="Ce que fait le dashboard" icon={ServerIcon} />
          <div className="p-5 text-sm text-slate-700 space-y-2">
            <div>• 1 utilisateur = 1 site WordPress</div>
            <div>• Paiement : Stripe Payment Links</div>
            <div>• Activation réelle (provisioning + DNS) : backend à venir</div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Zone sensible" subtitle="Reset local (prototype)" icon={Trash2} />
          <div className="p-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              Réinitialise les données locales du site (domaine, URLs, statut). Ne supprime pas le compte.
            </div>

            <Button
              className="w-full"
              variant="danger"
              loading={deleting}
              onClick={handleDeleteInstallation}
            >
              <Trash2 className="h-4 w-4" /> Supprimer le site WordPress
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
