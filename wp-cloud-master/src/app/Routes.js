import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./AppShell";

import Home from "../pages/Home";
import Pricing from "../pages/Pricing";
import Support from "../pages/Support";
import Login from "../pages/Login";
import Register from "../pages/Register";
import CreateServer from "../pages/CreateServer";
import Checkout from "../pages/Checkout";
import Confirmation from "../pages/Confirmation";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import Billing from "../pages/Billing";

export default function Router() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create" element={<CreateServer />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
