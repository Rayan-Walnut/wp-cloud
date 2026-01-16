// src/config/plans.js
export const PLANS = [
  {
    id: "storage-5gb",
    name: "Stockage +5 Go",
    priceMonthly: 4,
    tagline: "Stockage Optimal",
    perks: ["+4 Go de stockage", "Connectez votre nom de domaine"],
    highlight: false,
    stripeLink: "https://buy.stripe.com/test_8x214g4SXh0932L9i1eAg02",
  },
  {
    id: "storage-2gb",
    name: "Stockage +2 Go",
    priceMonthly: 2,
    tagline: "Pour démarrer un site WordPress avec plus de tranquillité.",
    perks: ["+2 Go de stockage", "Connectez votre nom de domaine"],
    highlight: true,
    stripeLink: "https://buy.stripe.com/test_bJe9AM859cJT7j1bq9eAg01",
  },
  {
    id: "storage-1gb",
    name: "Stockage +1 Go",
    priceMonthly: 1.5,
    tagline: "Pour démarrer un site WordPress",
    perks: ["+1 Go de stockage", "Connectez votre nom de domaine"],
    highlight: false,
    stripeLink: "https://buy.stripe.com/test_00wfZa7154dngTBeCleAg00",
  },
];

export const DEFAULT_NS = ["lara.ns.cloudflare.com", "miles.ns.cloudflare.com"];
