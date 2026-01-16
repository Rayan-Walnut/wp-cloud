import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, LogIn, Mail } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Form";
import { sleep } from "../utils/helpers";

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="mx-auto grid max-w-md gap-6">
      <header className="space-y-2 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        <p className="text-slate-600">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}

export default function Login() {
  const { setAuth } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("demo@exemple.com");
  const [loading, setLoading] = useState(false);

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre dashboard.">
      <Card>
        <div className="p-6 space-y-4">
          <Field label="Email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </Field>

          <Field label="Mot de passe" hint="Mock">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" type="password" defaultValue="password" />
            </div>
          </Field>

          <Button
            className="w-full"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await sleep(600);
              const clean = email.trim().toLowerCase();
              setAuth({ user: { email: clean, name: clean.split("@")[0] || "Utilisateur" } });
              setLoading(false);
              nav("/dashboard");
            }}
          >
            <LogIn className="h-4 w-4" />
            Se connecter
          </Button>

          <div className="text-center text-sm text-slate-600">
            Pas de compte ?{" "}
            <Link className="font-semibold text-slate-900 underline" to="/register">
              Inscription
            </Link>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}
