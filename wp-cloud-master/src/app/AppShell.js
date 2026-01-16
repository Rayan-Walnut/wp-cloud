import React, { useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  Menu,
  X,
  ChevronDown,
  CheckCircle2,
  LineChart,
  Wrench,
  LogOut,
  LogIn,
  UserPlus,
  Shield,
  CreditCard,
  Globe,
  LifeBuoy,
} from "lucide-react";

import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/Button";
import { Pill, Divider } from "../components/ui/Misc";
import { toastCopy } from "../utils/helpers";

const navItem =
  "relative rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition";
const navActive = "text-slate-900";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${navItem} ${isActive ? navActive : ""} hover:bg-slate-100`
      }
    >
      {({ isActive }) => (
        <span className="relative">
          {children}
          {isActive ? (
            <motion.span
              layoutId="nav-underline"
              className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-slate-900"
            />
          ) : null}
        </span>
      )}
    </NavLink>
  );
}

function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`${navItem} hover:bg-slate-100 inline-flex items-center gap-1`}
      >
        {label}
        <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          >
            <div className="p-2">
              {items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to}
                  className="group flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 transition"
                >
                  <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white">
                    <it.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:underline">
                      {it.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">{it.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function AppShell({ children }) {
  const { auth, setAuth, server } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const productItems = useMemo(
    () => [
      { to: "/pricing", title: "Tarifs & stockage", desc: "Plans mensuels + upgrades", icon: CreditCard },
      { to: "/support", title: "Support", desc: "FAQ, contact (mock)", icon: LifeBuoy },
      { to: auth.user ? "/dashboard" : "/login", title: "Dashboard", desc: "Statut, analytics, admin WP", icon: LineChart },
    ],
    [auth.user]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-white text-slate-900">
      {/* Header sticky */}
      <div className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <header className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-extrabold leading-tight">WP Cloud</div>
                <div className="text-xs text-slate-500">WordPress managé</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              <NavItem to="/">Accueil</NavItem>
              <Dropdown label="Produit" items={productItems} />
              <NavItem to="/pricing">Tarifs</NavItem>
              <NavItem to="/support">Support</NavItem>

              <div className="mx-2 h-6 w-px bg-slate-200" />

              {auth.user ? (
                <>
                  <NavItem to="/dashboard">Dashboard</NavItem>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setAuth({ user: null });
                      nav("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={() => nav("/login")}>
                    <LogIn className="h-4 w-4" />
                    Connexion
                  </Button>
                  <Button size="sm" onClick={() => nav("/register")}>
                    <UserPlus className="h-4 w-4" />
                    Créer un compte
                  </Button>
                </>
              )}
            </nav>

            {/* Mobile toggle */}
            <div className="md:hidden">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white p-2.5"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="md:hidden pb-4"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="grid gap-1">
                    <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100" to="/" onClick={() => setMobileOpen(false)}>
                      Accueil
                    </Link>
                    <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100" to="/pricing" onClick={() => setMobileOpen(false)}>
                      Tarifs
                    </Link>
                    <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100" to="/support" onClick={() => setMobileOpen(false)}>
                      Support
                    </Link>
                    <Divider className="my-2" />
                    {auth.user ? (
                      <>
                        <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100" to="/dashboard" onClick={() => setMobileOpen(false)}>
                          Dashboard
                        </Link>
                        <button
                          className="rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-slate-100"
                          onClick={() => {
                            setAuth({ user: null });
                            setMobileOpen(false);
                            nav("/");
                          }}
                          type="button"
                        >
                          Déconnexion
                        </button>
                      </>
                    ) : (
                      <>
                        <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100" to="/login" onClick={() => setMobileOpen(false)}>
                          Connexion
                        </Link>
                        <Link className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-slate-100" to="/register" onClick={() => setMobileOpen(false)}>
                          Créer un compte
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Top banner when live */}
      <div className="mx-auto max-w-6xl px-4">
        {server.status === "live" && auth.user ? (
          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              <div className="text-sm">
                <span className="font-semibold">Site en ligne :</span>{" "}
                <span className="font-mono">{server.siteUrl || `https://${server.domain}`}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toastCopy("(Mock) Ouverture admin WordPress…")}
              >
                <Wrench className="h-4 w-4" />
                Admin WP
              </Button>
              <Button size="sm" onClick={() => nav("/dashboard")}>
                <LineChart className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        ) : null}

        <main className="pb-16 pt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="border-t border-slate-100 py-10 text-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="text-slate-600">
              <div className="font-semibold text-slate-900">WP Cloud</div>
              <div className="mt-1">Prototype client-only. Branche ton API quand tu veux.</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100" to="/pricing">
                Tarifs
              </Link>
              <Link className="rounded-xl px-3 py-2 text-slate-700 hover:bg-slate-100" to="/support">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
