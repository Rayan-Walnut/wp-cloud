import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, CreditCard, Globe } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Form";
import { Divider } from "../components/ui/Misc";
import { formatEUR, isValidDomain, sleep } from "../utils/helpers";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-slate-600">{label}</div>
      <div className="text-right font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SummaryCard({ domain, plan }) {
  return (
    <Card>
      <CardHeader title="Récapitulatif" subtitle="Avant paiement" icon={CreditCard} />
      <div className="p-5 space-y-4 text-sm">
        <Row label="Domaine" value={domain?.trim() ? domain.trim().toLowerCase() : "—"} />
        <Row label="Plan" value={plan?.name || "—"} />
        <Divider />
        <Row
          label="Total"
          value={<span className="text-base font-extrabold">{formatEUR(plan?.priceMonthly || 0)}/mo</span>}
        />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Paiement mensuel (mock). Aucun appel serveur.
        </div>
      </div>
    </Card>
  );
}

export default function CreateServer() {
  const { auth, server, setServer, plans, deployWordPress, loading: apiLoading } = useApp();
  const nav = useNavigate();
  const loc = useLocation();

  // ✅ Hooks toujours au top
  const [domain, setDomain] = useState(server.domain || "");
  const [planId, setPlanId] = useState(server.planId || "basic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ redirect via useEffect (pas de return avant hooks)
  useEffect(() => {
    if (!auth.user) nav("/login", { replace: true });
    // 1 serveur max
    if (auth.user && server.status !== "none") nav("/dashboard", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, server.status]);

  // pré-sélection plan depuis Pricing
  useEffect(() => {
    if (loc.state?.planId) setPlanId(loc.state.planId);
  }, [loc.state]);

  const selected = useMemo(() => plans.find((p) => p.id === planId) || plans[0], [plans, planId]);

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          Créer votre serveur WordPress
        </h2>
        <p className="text-slate-600">Entrez votre domaine, choisissez un plan, puis payez.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card>
            <CardHeader title="Configuration" subtitle="Domaine + Plan" icon={Globe} />
            <div className="p-5 space-y-5">
              <Field label="Nom de domaine" hint="Ex: monsite.com" error={error}>
                <Input
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value);
                    setError("");
                  }}
                  placeholder="monsite.com"
                />
              </Field>

              <Field label="Plan">
                <div className="grid gap-3 md:grid-cols-3">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlanId(p.id)}
                      className={`rounded-2xl border p-4 text-left transition hover:bg-slate-50 ${
                        planId === p.id ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                      <div className="mt-1 text-sm text-slate-600">{formatEUR(p.priceMonthly)}/mo</div>
                      <div className="mt-2 text-xs text-slate-500">{p.tagline}</div>
                    </button>
                  ))}
                </div>
              </Field>

              <Divider />

              <Button
                className="w-full"
                loading={loading || apiLoading}
                onClick={async () => {
                  const d = domain.trim().toLowerCase();
                  if (!isValidDomain(d)) {
                    setError("Veuillez entrer un domaine valide (ex: monsite.com).");
                    return;
                  }

                  try {
                    setLoading(true);
                    setError("");

                    // Déployer via l'API
                    await deployWordPress(d, auth.user.email);

                    setLoading(false);
                    // Rediriger vers la confirmation DNS
                    nav("/confirmation");
                  } catch (err) {
                    setLoading(false);
                    setError(err.message || "Erreur lors du déploiement. Veuillez réessayer.");
                    console.error("Erreur déploiement:", err);
                  }
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Déployer WordPress maintenant
              </Button>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <SummaryCard domain={domain} plan={selected} />
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Inclus</div>
            <ul className="mt-2 space-y-1">
              {selected.perks.slice(0, 3).map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
