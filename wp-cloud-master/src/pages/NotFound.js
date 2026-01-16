import React from "react";
import { Link } from "react-router-dom";
import { Server } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
        <Server className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-2xl font-extrabold">Page introuvable</h2>
      <p className="mt-2 text-slate-600">Retourner à l’accueil.</p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
