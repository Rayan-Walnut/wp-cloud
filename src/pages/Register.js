import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, UserPlus } from "lucide-react";
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

export default function Register() {
  const { setAuth } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState("Alex");
  const [email, setEmail] = useState("alex@exemple.com");
  const [loading, setLoading] = useState(false);

  return (
    <AuthLayout title="Inscription" subtitle="Créez votre compte.">
      <Card>
        <div className="p-6 space-y-4">
          <Field label="Nom">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>

          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Field label="Mot de passe" hint="Mock">
            <Input type="password" defaultValue="password" />
          </Field>

          <Button
            className="w-full"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              await sleep(700);
              const clean = email.trim().toLowerCase();
              setAuth({ user: { email: clean, name: name.trim() || "Utilisateur" } });
              setLoading(false);
              nav("/create");
            }}
          >
            <UserPlus className="h-4 w-4" />
            Créer mon compte
          </Button>

          <div className="text-center text-sm text-slate-600">
            Déjà un compte ?{" "}
            <Link className="font-semibold text-slate-900 underline" to="/login">
              Connexion
            </Link>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}
