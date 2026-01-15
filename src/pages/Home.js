import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cloud,
  CreditCard,
  Globe,
  LineChart,
  Lock,
  Rocket,
  Timer,
  CheckCircle2,
  Shield,
  Zap,
  Gauge,
  LifeBuoy,
  Quote,
  ChevronDown,
} from "lucide-react";

import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Pill, Divider } from "../components/ui/Misc";
import { useApp } from "../context/AppContext";
import { formatEUR } from "../utils/helpers";

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-700">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="mt-2 text-lg font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

function StepRow({ idx, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-xs font-extrabold text-white">
        {idx}
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-slate-600">{desc}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-base font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</div>
    </div>
  );
}

function Testimonial({ name, role, text }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{name}</div>
          <div className="text-xs text-slate-500">{role}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
          <Quote className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700">{text}</p>
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-slate-900">
            ★
          </span>
        ))}
      </div>
    </div>
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
      {open ? <div className="mt-2 text-sm leading-relaxed text-slate-600">{a}</div> : null}
    </button>
  );
}

function PlanPreview({ plan, onChoose }) {
  return (
    <Card className={`relative overflow-hidden ${plan.highlight ? "ring-2 ring-slate-900" : ""}`}>
      {plan.highlight && (
        <div className="absolute right-4 top-4">
          <Pill tone="blue">Recommandé</Pill>
        </div>
      )}

      <div className="p-6">
        <div className="text-sm font-semibold text-slate-900">{plan.name}</div>

        <div className="mt-2 text-3xl font-extrabold">
          {formatEUR(plan.priceMonthly)}
          <span className="text-sm font-semibold text-slate-500">/mo</span>
        </div>

        <div className="mt-2 text-sm text-slate-600">{plan.tagline}</div>

        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          {plan.perks.map((k) => (
            <li key={k} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {k}
            </li>
          ))}
        </ul>

        <Button className="mt-6 w-full" onClick={onChoose}>
          <CreditCard className="h-4 w-4" />
          Choisir
        </Button>
      </div>
    </Card>
  );
}


export default function Home() {
  const { auth, server, plans } = useApp();
  const nav = useNavigate();

  const ctaHref = auth.user ? (server.status === "none" ? "/create" : "/dashboard") : "/register";
  const ctaLabel = auth.user ? (server.status === "none" ? "Créer mon serveur" : "Aller au dashboard") : "Démarrer";

  const sortedPlans = useMemo(() => {
    // tri simple : du + cher au - cher (ou change si tu veux)
    return [...plans].sort((a, b) => (b.priceMonthly ?? 0) - (a.priceMonthly ?? 0));
  }, [plans]);

  const [faqOpen, setFaqOpen] = useState(0);

  return (
    <div className="grid gap-12">
      {/* HERO */}
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            <Cloud className="h-3.5 w-3.5" />
            Un serveur WordPress par utilisateur • Paiement Stripe/PayPal (mock)
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
            Créez votre WordPress sur votre domaine, en quelques clics.
          </h1>

          <p className="text-base leading-relaxed text-slate-600 md:text-lg">
            Choisissez votre abonnement stockage, payez, puis connectez vos DNS. Tout est côté client pour l’instant —
            vous brancherez l’API ensuite.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={() => nav(ctaHref)}>
              <Rocket className="h-5 w-5" />
              {ctaLabel}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => nav("/pricing")}>
              <CreditCard className="h-5 w-5" />
              Voir les tarifs
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <MiniStat icon={Lock} label="Auth" value="Mock" />
            <MiniStat icon={Timer} label="Provisioning" value="Simulé" />
            <MiniStat icon={Globe} label="Domaine" value="Déjà possédé" />
            <MiniStat icon={LineChart} label="Analytics" value="Basiques" />
          </div>

          {/* Trust strip */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-semibold text-slate-900">Déjà utilisé par des créateurs & freelances</div>
              <div className="flex flex-wrap gap-2 text-xs">
                <Pill>SSL</Pill>
                <Pill>CDN</Pill>
                <Pill>WAF</Pill>
                <Pill>Cloudflare DNS</Pill>
              </div>
            </div>
          </div>
        </div>

        {/* Preview card */}
        <div className="relative">
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-slate-200 via-white to-slate-200 blur-2xl" />
          <Card className="relative overflow-hidden">
            <CardHeader title="Aperçu du parcours" subtitle="Création → Paiement → DNS → En ligne" icon={Cloud} />
            <div className="p-5">
              <div className="grid gap-4">
                <StepRow idx="01" title="Connexion / Inscription" desc="Un compte = un serveur WordPress" />
                <StepRow idx="02" title="Domaine & Abonnement" desc="Choisissez votre stockage" />
                <StepRow idx="03" title="Paiement" desc="Stripe ou PayPal (mock)" />
                <StepRow idx="04" title="DNS" desc="Nameservers Cloudflare à configurer" />
                <StepRow idx="05" title="Dashboard" desc="Statut, admin WP, analytics, support" />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <Pill tone="blue">Client-only</Pill> Branche ton API plus tard (paiements, provisioning, DNS check…)
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FEATURES */}
      <section className="grid gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Pourquoi ça marche</h2>
          <p className="text-slate-600">
            Une expérience simple pour l’utilisateur, et une architecture facile à connecter à ton backend ensuite.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={Zap}
            title="Provisioning rapide"
            desc="UI fluide + loaders pour simuler création serveur. Tu remplaces par ton API ensuite."
          />
          <FeatureCard
            icon={Shield}
            title="Sécurité"
            desc="Domaine connecté via Cloudflare DNS, SSL, et options WAF/Rate limit côté backend."
          />
          <FeatureCard
            icon={Gauge}
            title="Suivi & analytics"
            desc="Dashboard avec visiteurs et uptime (mock). Branchable à ton tracking/monitoring."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={CreditCard}
            title="Stripe + PayPal"
            desc="Boutons mock aujourd’hui. Demain : sessions Stripe + PayPal SDK + webhooks."
          />
          <FeatureCard
            icon={Globe}
            title="Nom de domaine existant"
            desc="L’utilisateur saisit son domaine, et suit un tutoriel registrar (OVH, Namecheap, Gandi…)."
          />
          <FeatureCard
            icon={LifeBuoy}
            title="Support"
            desc="Page support prête. Tu brancheras tickets, chat, email, ou système interne."
          />
        </div>
      </section>

      <section className="grid gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Abonnement mensuel
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                Paiement Stripe
              </span>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
              Abonnements stockage
            </h2>
            <p className="text-slate-600">
              Choisis ton stockage selon ton besoin. Paiement sécurisé via Stripe, renouvellement mensuel automatique.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={() => nav("/pricing")}>
              Voir la page tarifs
            </Button>
            <Button variant="ghost" onClick={() => nav("/support")}>
              Besoin d’aide ?
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {sortedPlans.map((p) => (
            <div
              key={p.id}
              className="group rounded-3xl transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <PlanPreview
                key={p.id}
                plan={p}
                onChoose={() => {
                  if (!p.stripeLink) {
                    alert("Lien Stripe manquant pour ce plan");
                    return;
                  }
                  window.location.href = p.stripeLink;
                }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="grid gap-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Ils en parlent</h2>
          <p className="text-slate-600">Commentaires mock (à remplacer par des avis réels plus tard).</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Testimonial
            name="Sarah M."
            role="Freelance • Site vitrine"
            text="J’ai connecté mon domaine en quelques minutes. L’interface est claire, surtout le tuto DNS selon le registrar."
          />
          <Testimonial
            name="Yanis K."
            role="Créateur • Blog WordPress"
            text="Le dashboard est simple et efficace. J’aime bien les spinners et les états ‘en attente DNS → en ligne’."
          />
          <Testimonial
            name="Nina D."
            role="PM • MVP SaaS"
            text="Parfait pour brancher une API ensuite : tout le parcours est déjà là, il manque juste les vrais appels."
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="grid gap-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">FAQ</h2>
          <p className="text-slate-600">Les questions classiques (mock).</p>
        </div>

        <div className="grid gap-3">
          <FAQItem
            q="Je peux créer plusieurs serveurs ?"
            a="Non. Un seul serveur WordPress par utilisateur (logique actuelle)."
            open={faqOpen === 0}
            onToggle={() => setFaqOpen(faqOpen === 0 ? -1 : 0)}
          />
          <FAQItem
            q="Le paiement est-il réel ?"
            a="Non, c’est simulé. Tu brancheras Stripe/PayPal plus tard (sessions + webhooks)."
            open={faqOpen === 1}
            onToggle={() => setFaqOpen(faqOpen === 1 ? -1 : 1)}
          />
          <FAQItem
            q="Combien de temps pour que le site soit en ligne ?"
            a="En réel, ça dépend de la propagation DNS (minutes → 24h). Ici c’est simulé."
            open={faqOpen === 2}
            onToggle={() => setFaqOpen(faqOpen === 2 ? -1 : 2)}
          />
          <FAQItem
            q="Je fais comment pour OVH / Namecheap / Gandi ?"
            a="Sur la page de confirmation, tu choisis ton registrar et tu as les étapes + un espace vidéo/visuel."
            open={faqOpen === 3}
            onToggle={() => setFaqOpen(faqOpen === 3 ? -1 : 3)}
          />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-semibold text-slate-900">Prêt à lancer ton WordPress ?</div>
            <div className="mt-1 text-sm text-slate-600">
              Tu peux déjà valider tout le parcours côté client, puis brancher ton API ensuite.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => nav("/pricing")}>
              Voir les tarifs
            </Button>
            <Button onClick={() => nav(ctaHref)}>
              <Rocket className="h-4 w-4" />
              {ctaLabel}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
