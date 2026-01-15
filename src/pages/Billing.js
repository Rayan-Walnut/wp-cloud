import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Receipt,
  Shield,
  RefreshCw,
  ArrowLeft,
  Download,
  LifeBuoy,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

import { useApp } from "../context/AppContext";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Divider, Pill } from "../components/ui/Misc";
import { formatEUR, sleep, toastCopy } from "../utils/helpers";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="text-slate-600">{label}</div>
      <div className="text-right font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function InvoiceRow({ id, date, amount, status }) {
  const tone = status === "Payée" ? "emerald" : status === "En attente" ? "amber" : "slate";
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-slate-300 hover:shadow-md"
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">Facture {id}</div>
        <div className="mt-0.5 text-xs text-slate-500">{date}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm font-extrabold text-slate-900">{amount}</div>
        <Pill tone={tone}>{status}</Pill>
        <Button size="sm" variant="secondary" onClick={() => toastCopy("(Mock) Téléchargement PDF…")}>
          <Download className="h-4 w-4" />
          PDF
        </Button>
      </div>
    </motion.div>
  );
}

export default function Billing() {
  const { auth, server, plans } = useApp();
  const nav = useNavigate();

  // ✅ Hooks TOUJOURS en haut (avant toute redirection)
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingRenew, setLoadingRenew] = useState(false);

  // ✅ Redirect propre via useEffect (pas de hooks conditionnels)
  useEffect(() => {
    if (!auth.user) nav("/login", { replace: true });
  }, [auth.user, nav]);

  const plan = useMemo(() => {
    return plans.find((p) => p.id === server.planId) || plans[0];
  }, [plans, server.planId]);

  const invoices = useMemo(() => {
    const baseDate = server.lastPayment ? new Date(server.lastPayment) : new Date();
    const fmt = (d) => d.toLocaleDateString("fr-FR");
    const price = formatEUR(plan?.priceMonthly || 0);

    return [
      { id: "2026-0003", date: fmt(baseDate), amount: price, status: "Payée" },
      { id: "2025-0002", date: fmt(new Date(baseDate.getTime() - 30 * 24 * 3600 * 1000)), amount: price, status: "Payée" },
      { id: "2025-0001", date: fmt(new Date(baseDate.getTime() - 60 * 24 * 3600 * 1000)), amount: price, status: "Payée" },
    ];
  }, [plan?.priceMonthly, server.lastPayment]);

  // Si pas connecté, on ne rend rien (la redirection se fait)
  if (!auth.user) return null;

  const openStripePortalMock = async () => {
    setLoadingPortal(true);
    await sleep(900);
    setLoadingPortal(false);
    toastCopy("(Mock) Ouverture Stripe Customer Portal…");
  };

  const openPayPalPortalMock = async () => {
    setLoadingPortal(true);
    await sleep(900);
    setLoadingPortal(false);
    toastCopy("(Mock) Ouverture PayPal Billing…");
  };

  const renewMock = async () => {
    setLoadingRenew(true);
    await sleep(900);
    setLoadingRenew(false);
    toastCopy("(Mock) Renouvellement effectué !");
  };

  return (
    <div className="grid gap-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <Receipt className="h-3.5 w-3.5" />
              Facturation • Abonnement
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Gérer la facturation</h2>
            <div className="text-sm text-slate-700">
              Plan : <span className="font-semibold">{plan?.name || "—"}</span>{" "}
              <span className="text-slate-500">•</span>{" "}
              <span className="font-semibold">{formatEUR(plan?.priceMonthly || 0)}/mo</span>
            </div>
            <div className="text-sm text-slate-600">
              Ici tu mettras ton Stripe Customer Portal / PayPal Billing plus tard. Pour l’instant : mock UI.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => nav("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
              Retour dashboard
            </Button>
            <Button variant="secondary" onClick={() => nav("/support")}>
              <LifeBuoy className="h-4 w-4" />
              Support
            </Button>
          </div>
        </div>
      </section>

      {/* Main */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Subscription summary */}
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader
            title="Abonnement"
            subtitle="Résumé & statut"
            icon={CreditCard}
            right={
              <Pill tone="emerald">
                <CheckCircle2 className="h-3.5 w-3.5" /> Actif
              </Pill>
            }
          />
          <div className="p-6 space-y-4">
            <Row label="Domaine" value={server.domain || "—"} />
            <Row label="Plan" value={plan?.name || "—"} />
            <Row label="Prix" value={`${formatEUR(plan?.priceMonthly || 0)}/mo`} />
            <Row
              label="Dernier paiement"
              value={server.lastPayment ? new Date(server.lastPayment).toLocaleString("fr-FR") : "—"}
            />
            <Row label="Prochain renouvellement" value={server.lastPayment ? "Dans 30 jours (mock)" : "—"} />

            <Divider />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">Actions :</span> renouveler, changer de plan, gérer les moyens de paiement.
              </div>
              <div className="flex flex-wrap gap-2">
                <Button loading={loadingRenew} onClick={renewMock}>
                  <RefreshCw className="h-4 w-4" />
                  Renouveler (mock)
                </Button>
                <Button variant="secondary" onClick={() => nav("/pricing")}>
                  <CreditCard className="h-4 w-4" />
                  Changer de plan
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Portal */}
        <Card className="overflow-hidden">
          <CardHeader title="Portail de facturation" subtitle="Stripe / PayPal" icon={Shield} />
          <div className="p-6 space-y-3">
            <Button className="w-full" loading={loadingPortal} onClick={openStripePortalMock}>
              <CreditCard className="h-4 w-4" />
              Ouvrir Stripe Portal (mock)
            </Button>
            <Button className="w-full" variant="secondary" loading={loadingPortal} onClick={openPayPalPortalMock}>
              <Shield className="h-4 w-4" />
              Ouvrir PayPal Billing (mock)
            </Button>

            <Divider />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              À brancher : Stripe Customer Portal / PayPal Subscription Management + factures PDF.
            </div>
          </div>
        </Card>
      </section>

      {/* Invoices */}
      <Card className="overflow-hidden">
        <CardHeader title="Historique des factures" subtitle="Téléchargement PDF (mock)" icon={Receipt} />
        <div className="p-6 grid gap-3">
          {invoices.map((inv) => (
            <InvoiceRow key={inv.id} id={inv.id} date={inv.date} amount={inv.amount} status={inv.status} />
          ))}
        </div>
      </Card>
    </div>
  );
}
