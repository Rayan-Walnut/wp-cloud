import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Shield } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Divider } from "../components/ui/Misc";
import { formatEUR, sleep } from "../utils/helpers";
import { STRIPE_PAYMENT_LINKS } from "../config/stripe";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <div className="text-slate-600">{label}</div>
      <div className="text-right font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function Checkout() {
  const { auth, server, setServer, plans } = useApp();
  const nav = useNavigate();

  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState("stripe");

  useEffect(() => {
    if (!auth.user) nav("/login", { replace: true });
    if (auth.user && server.status === "none") nav("/create", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, server.status]);

  const plan = useMemo(
    () => plans.find((p) => p.id === server.planId) || plans[0],
    [plans, server.planId]
  );

  const payMock = async () => {
    setPaying(true);
    await sleep(900);

    const now = new Date().toISOString();
    const domain = server.domain;

    setServer((prev) => ({
      ...prev,
      status: "awaiting_dns",
      lastPayment: now,
      siteUrl: `https://${domain}`,
      wpAdminUrl: `https://${domain}/wp-admin`,
    }));

    setPaying(false);
    nav("/confirmation");
  };

  const payWithStripe = () => {
    const url = STRIPE_PAYMENT_LINKS[server.planId];
    if (!url) {
      alert("Lien Stripe manquant pour ce plan");
      return;
    }
    window.location.href = url;
  };

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          Paiement
        </h2>
        <p className="text-slate-600">
          Récapitulatif final et sélection du mode de paiement.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <Card>
            <CardHeader
              title="Choisir un mode de paiement"
              subtitle="Stripe (Payment Link) ou PayPal (mock)"
              icon={CreditCard}
            />

            <div className="p-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  className="w-full"
                  loading={paying && method === "stripe"}
                  onClick={payWithStripe}
                >
                  <CreditCard className="h-4 w-4" />
                  Payer avec Stripe
                </Button>

                <Button
                  className="w-full"
                  variant="secondary"
                  loading={paying && method === "paypal"}
                  onClick={payMock}
                >
                  <Shield className="h-4 w-4" />
                  Payer avec PayPal (mock)
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader title="Récapitulatif" subtitle="Avant paiement" icon={CreditCard} />
            <div className="p-5 space-y-3">
              <Row label="Domaine" value={server.domain || "—"} />
              <Row label="Plan" value={plan?.name || "—"} />
              <Divider />
              <Row label="Total" value={`${formatEUR(plan?.priceMonthly || 0)}/mo`} />
              <Button variant="ghost" className="w-full" onClick={() => nav("/create")}>
                Modifier
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
