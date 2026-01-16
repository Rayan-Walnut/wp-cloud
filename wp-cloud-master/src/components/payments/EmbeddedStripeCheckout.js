import React, { useCallback } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { stripePromise } from "../../lib/stripe";

/**
 * Props:
 * - planId: "storage-1gb" | "storage-2gb" | "storage-5gb"
 */
export default function EmbeddedStripeCheckout({ planId }) {
  // Stripe exige une fonction async qui renvoie le client_secret :contentReference[oaicite:2]{index=2}
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/stripe/checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Erreur création session Stripe");
    }

    const data = await res.json();
    return data.clientSecret; // <- obligatoire
  }, [planId]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
