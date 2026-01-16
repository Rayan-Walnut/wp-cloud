import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CreditCard,
  Shield,
  Zap,
  Globe,
  LifeBuoy,
  Sparkles,
  ArrowRight,
  Info,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useApp } from "../context/AppContext";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill, Divider } from "../components/ui/Misc";
import { formatEUR } from "../utils/helpers";

function FeaturePill({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
      <Icon className="h-4 w-4" />
      {text}
    </span>
  );
}

function PlanCard({ plan, price, onChoose }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.15 }}
      className={`relative rounded-3xl border bg-white shadow-sm hover:shadow-xl ${
        plan.highlight ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {plan.highlight ? (
        <div className="absolute right-4 top-4">
          <Pill tone="blue">Recommandé</Pill>
        </div>
      ) : null}

      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{plan.name}</div>
            <div className="mt-1 text-xs text-slate-500">{plan.tagline}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="text-3xl font-extrabold text-slate-900">
            {formatEUR(price)}
            <span className="ml-1 text-sm font-semibold text-slate-500">/mo</span>
          </div>
          <Pill tone="slate">Stockage</Pill>
        </div>

        <Divider className="my-5" />

        <ul className="space-y-2 text-sm text-slate-700">
          {plan.perks.map((k) => (
            <li key={k} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> {k}
            </li>
          ))}
          <li className="flex items-center gap-2 text-slate-600">
            <Globe className="h-4 w-4" /> 1 serveur WordPress / utilisateur
          </li>
        </ul>

        <Button className="mt-6 w-full" onClick={onChoose}>
          <CreditCard className="h-4 w-4" />
          Choisir ce plan
          <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="mt-3 text-xs text-slate-500">
          Paiement via Stripe (Payment Link). Retour automatique vers la confirmation.
        </div>
      </div>
    </motion.div>
  );
}

function FAQItem({ q, a, open, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold text-slate-900">{q}</div>
        <ChevronDown className={`h-4 w-4 text-slate-600 transition ${open ? "rotate-180" : ""}`} />
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-sm leading-relaxed text-slate-600">{a}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </button>
  );
}

export default function Pricing() {
  const { plans, auth } = useApp();
  const nav = useNavigate();

  // Toggle UI: mensuel/annuel (annuel = simulation tant que tu n'as pas créé des Payment Links annuels)
  const [billing, setBilling] = useState("monthly"); // monthly | yearly

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => (b.priceMonthly ?? 0) - (a.priceMonthly ?? 0));
  }, [plans]);

  const computedPrice = (p) => {
    if (billing === "monthly") return p.priceMonthly;
    // simulation annuel : 2 mois off -> p.priceMonthly * 10 (à afficher)
    return Math.round((p.priceMonthly * 10) * 100) / 100;
  };

  const [faqOpen, setFaqOpen] = useState(0);

  const goStripe = (plan) => {
    // ⚠️ Forcer la connexion avant de choisir un plan
    if (!auth.user) {
      alert("Veuillez vous connecter ou créer un compte avant de choisir un plan.");
      nav("/login");
      return;
    }

    // Rediriger vers la page de création avec le plan sélectionné
    nav("/create", { state: { planId: plan.id } });
  };

  return (
    <div className="grid gap-10">
      {/* Hero Pricing */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" />

        <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
              <CreditCard className="h-3.5 w-3.5" />
              Abonnements stockage • WordPress sur votre domaine
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Des tarifs simples, pensés pour un seul site WordPress.
            </h2>

            <p className="text-slate-600">
              Choisissez votre stockage, connectez votre domaine, payez via Stripe, puis suivez les étapes DNS sur la page de confirmation.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <FeaturePill icon={Shield} text="SSL & DNS Cloudflare" />
              <FeaturePill icon={Zap} text="Perf & cache (à brancher)" />
              <FeaturePill icon={LifeBuoy} text="Support (mock)" />
            </div>
          </div>

          {/* Toggle */}
          <div className="flex flex-col items-start gap-4 md:items-end">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    billing === "monthly" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => setBilling("monthly")}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    billing === "yearly" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                  onClick={() => setBilling("yearly")}
                >
                  Annuel
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    -2 mois
                  </span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              * Annuel = affichage simulé tant que tu n’as pas créé des Payment Links annuels.
            </div>

            <Button
              onClick={() => {
                const recommended = sortedPlans.find((p) => p.highlight) || sortedPlans[0];
                if (recommended?.stripeLink) goStripe(recommended);
                else nav("/create");
              }}
              className="w-full md:w-auto"
            >
              Démarrer maintenant <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="grid gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">Choisissez votre plan</h3>
            <p className="text-slate-600">Tous les plans incluent la connexion du nom de domaine.</p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
            <Info className="h-4 w-4" />
            1 serveur WordPress par utilisateur
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {sortedPlans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              price={computedPrice(p)}
              onChoose={() => goStripe(p)} // ✅ Stripe Payment Link
            />
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="grid gap-4">
        <Card className="overflow-hidden">
          <CardHeader title="Ce qui est inclus" subtitle="Même base pour tous les plans" icon={Shield} />
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Domaine</div>
                <div className="mt-2 text-sm text-slate-600">Connexion via nameservers Cloudflare + tuto registrar.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">WordPress</div>
                <div className="mt-2 text-sm text-slate-600">Lien admin WP, statut, mise en ligne après DNS.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Dashboard</div>
                <div className="mt-2 text-sm text-slate-600">Analytics basiques + renouvellement + support.</div>
              </div>
            </div>

            <Divider className="my-6" />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">À brancher côté backend (plus tard)</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Provisioning WordPress (VM/containers) + quotas</li>
                  <li>Vérification DNS (polling) + activation</li>
                  <li>Customer Portal / changements de plan</li>
                  <li>Webhooks pour automatiser l’activation</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Pourquoi c’est clean</div>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> UI prête, logique simple (1 serveur / user)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Paiement Stripe déjà opérationnel via Payment Links
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Migration facile vers backend/webhooks plus tard
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="grid gap-6">
        <div>
          <h3 className="text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl">FAQ</h3>
          <p className="text-slate-600">Questions fréquentes sur les plans et le paiement.</p>
        </div>

        <div className="grid gap-3">
          <FAQItem
            q="Puis-je changer de plan plus tard ?"
            a="Oui. Plus tard, on branchera le portail Stripe (Customer Portal) ou un backend pour gérer upgrade/downgrade automatiquement."
            open={faqOpen === 0}
            onToggle={() => setFaqOpen(faqOpen === 0 ? -1 : 0)}
          />
          <FAQItem
            q="Le paiement est-il réel ?"
            a="Oui : Stripe est actif via Payment Links. Le provisioning WordPress et la vérification DNS restent simulés tant que le backend n’est pas branché."
            open={faqOpen === 1}
            onToggle={() => setFaqOpen(faqOpen === 1 ? -1 : 1)}
          />
          <FAQItem
            q="Que signifie “Connectez votre nom de domaine” ?"
            a="Après paiement, vous recevez des nameservers Cloudflare à mettre chez votre registrar (OVH/Namecheap/Gandi…)."
            open={faqOpen === 2}
            onToggle={() => setFaqOpen(faqOpen === 2 ? -1 : 2)}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-semibold text-slate-900">Prêt à lancer ?</div>
            <div className="mt-1 text-sm text-slate-600">Choisis ton plan, connecte ton domaine, et passe en ligne.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => nav("/support")}>
              Support <LifeBuoy className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                const recommended = sortedPlans.find((p) => p.highlight) || sortedPlans[0];
                if (recommended?.stripeLink) goStripe(recommended);
                else nav("/create");
              }}
            >
              Démarrer <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
