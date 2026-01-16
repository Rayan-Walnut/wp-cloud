import React from "react";
import { LifeBuoy, Shield } from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Form";
import { toastCopy } from "../utils/helpers";

function FAQ({ q, a }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{q}</div>
      <div className="mt-1 text-slate-600">{a}</div>
    </div>
  );
}

export default function Support() {
  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Support</h2>
        <p className="text-slate-600">Page support (prototype). Rien n’est envoyé côté serveur.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Contact" subtitle="Réponse sous 24h (mock)" icon={LifeBuoy} />
          <div className="p-5 space-y-4">
            <Field label="Email">
              <Input placeholder="vous@exemple.com" />
            </Field>

            <Field label="Message">
              <textarea
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200"
                rows={5}
                placeholder="Expliquez votre problème…"
              />
            </Field>

            <Button onClick={() => toastCopy("(Mock) Message envoyé !")}>Envoyer</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="FAQ" subtitle="Questions fréquentes" icon={Shield} />
          <div className="p-5 space-y-3 text-sm text-slate-700">
            <FAQ q="Puis-je créer plusieurs serveurs ?" a="Non, 1 serveur WordPress par utilisateur." />
            <FAQ q="Le paiement est-il réel ?" a="Non. Les boutons Stripe/PayPal sont des mocks côté client." />
            <FAQ q="Quand mon site passe 'En ligne' ?" a="Après simulation de configuration DNS sur la confirmation." />
          </div>
        </Card>
      </div>
    </div>
  );
}
