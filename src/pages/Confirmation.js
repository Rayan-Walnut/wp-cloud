import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Copy } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Divider, Pill } from "../components/ui/Misc";
import { toastCopy } from "../utils/helpers";
import { DEFAULT_NS } from "../data/plans"; // <- adapte le chemin si besoin

function NsRow({ ns }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="font-mono text-sm text-slate-800">{ns}</span>
      <Button size="sm" variant="secondary" onClick={() => toastCopy(ns)}>
        <Copy className="h-4 w-4" />
        Copier
      </Button>
    </div>
  );
}

export default function Confirmation() {
  const { auth, server, setServer } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!auth.user) {
      nav("/login", { replace: true });
      return;
    }

    const success = params.get("success") === "1";
    const provider = params.get("provider") || "stripe";

    // Si l’utilisateur arrive ici après Stripe (success=1), on “active” le flow DNS
    if (success) {
      const now = new Date().toISOString();
      const domain = server.domain || "monsite.com";

      setServer((prev) => ({
        ...prev,
        status: "awaiting_dns",
        lastPayment: now,
        paymentProvider: provider,
        siteUrl: prev.siteUrl || `https://${domain}`,
        wpAdminUrl: prev.wpAdminUrl || `https://${domain}/wp-admin`,
        nameservers: prev.nameservers || DEFAULT_NS,
      }));
    }
  }, [auth.user, nav, params, server.domain, setServer]);

  const ns = server.nameservers && server.nameservers.length > 0 ? server.nameservers : DEFAULT_NS;

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
          Configuration DNS
        </h2>
        <p className="text-slate-600">
          Votre site WordPress est déployé ! Configurez maintenant les nameservers Cloudflare.
        </p>
      </header>

      <Card>
        <CardHeader
          title="Déploiement réussi"
          subtitle="Configurez les nameservers pour activer votre site"
          icon={CheckCircle2}
          right={<Pill tone="emerald">Déployé</Pill>}
        />
        <div className="p-5 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            ✅ Votre site WordPress est déployé ! Configurez les nameservers ci-dessous chez votre registrar de domaine pour activer le site.
          </div>

          {server.domain && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
              <div className="font-semibold">Domaine : {server.domain}</div>
              {server.mysql_password && (
                <div className="mt-2 text-xs">
                  <strong>Mot de passe MySQL :</strong> <code className="bg-blue-100 px-1 py-0.5 rounded">{server.mysql_password}</code>
                  <br />
                  <span className="text-blue-700">⚠️ Sauvegardez ce mot de passe, il ne sera plus affiché</span>
                </div>
              )}
            </div>
          )}

          <Divider />

          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Nameservers à mettre chez ton registrar</div>
            <div className="text-sm text-slate-600">
              Remplace les nameservers actuels de ton domaine par ceux-ci :
            </div>

            <div className="grid gap-2">
              {ns.map((n) => (
                <NsRow key={n} ns={n} />
              ))}
            </div>

            <div className="pt-2">
              <Button variant="secondary" onClick={() => toastCopy(ns.join("\n"))}>
                Copier les 2
              </Button>
            </div>
          </div>

          <Divider />

          <div className="flex flex-col gap-2 md:flex-row">
            <Button onClick={() => nav("/dashboard")}>Aller au dashboard</Button>
            <Button variant="ghost" onClick={() => nav("/support")}>
              Besoin d’aide ?
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
