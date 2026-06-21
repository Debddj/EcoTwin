import type { EmissionFactor, TransactionCategory } from "@/types";

export const EMISSION_FACTORS: Record<TransactionCategory, EmissionFactor> = {
  Fuel: {
    category: "Fuel",
    kgCo2ePerDollar: 0.82,
    label: "Gasoline & Fuel",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    hexColor: "#F59E0B",
    tip: "Try carpooling, cycling, or commuter rail. Each gas-free day saves ~4kg CO₂.",
  },
  Flights: {
    category: "Flights",
    kgCo2ePerDollar: 1.25,
    label: "Aviation & Flights",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    hexColor: "#EF4444",
    tip: "One transatlantic flight = 2 months of driving. Consider trains for regional routes.",
  },
  Groceries: {
    category: "Groceries",
    kgCo2ePerDollar: 0.22,
    label: "Food & Groceries",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    hexColor: "#10B981",
    tip: "Swapping beef for beans 3× a week cuts grocery emissions by 40%.",
  },
  "Fast Fashion": {
    category: "Fast Fashion",
    kgCo2ePerDollar: 0.45,
    label: "Apparel & Fashion",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    hexColor: "#8B5CF6",
    tip: "A single polyester jacket takes 200 years to decompose. Try thrift stores.",
  },
  Utilities: {
    category: "Utilities",
    kgCo2ePerDollar: 0.65,
    label: "Home Energy & Utilities",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    hexColor: "#3B82F6",
    tip: "Dropping thermostat 2°C in winter saves ~10% on heating emissions.",
  },
  "Public Transit": {
    category: "Public Transit",
    kgCo2ePerDollar: 0.12,
    label: "Buses, Trains & Subway",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    hexColor: "#06B6D4",
    tip: "Mass transit is 80% cleaner per km than solo car travel. Great choice!",
  },
  "Restaurants & Services": {
    category: "Restaurants & Services",
    kgCo2ePerDollar: 0.18,
    label: "Dining & Food Services",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    hexColor: "#F97316",
    tip: "Prefer farm-to-table restaurants and avoid food waste.",
  },
  Entertainment: {
    category: "Entertainment",
    kgCo2ePerDollar: 0.08,
    label: "Streaming & Recreation",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    hexColor: "#6B7280",
    tip: "Digital streaming has a tiny footprint. Keep enjoying responsibly.",
  },
  "Eco Goods": {
    category: "Eco Goods",
    kgCo2ePerDollar: 0.04,
    label: "Sustainable & Green Products",
    color: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    hexColor: "#14B8A6",
    tip: "Zero-waste refills and solar credits are your best purchases.",
  },
};

export const DEMO_PRESETS = [
  {
    name: "Frequent Flyer",
    description: "Flights, luxury fuel, and fast fashion weekly.",
    badge: "High Impact 🏜️",
    color:
      "from-rose-500/10 to-red-600/10 hover:from-rose-500/20 border-red-500/30 text-rose-400",
    transactions: [
      { date: "2026-06-15", merchant: "Delta Air Lines", amount: 480, category: "Flights" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-16", merchant: "Shell Gasoline", amount: 72.5, category: "Fuel" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-17", merchant: "Zara", amount: 185, category: "Fast Fashion" as const, source: "seed" as const, confidence: 0.95 },
      { date: "2026-06-18", merchant: "STK Steakhouse", amount: 120, category: "Restaurants & Services" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-19", merchant: "BP Gas Fill", amount: 68, category: "Fuel" as const, source: "seed" as const, confidence: 0.98 },
      { date: "2026-06-20", merchant: "Pacific Gas & Electric", amount: 140, category: "Utilities" as const, source: "seed" as const, confidence: 1 },
    ],
  },
  {
    name: "Suburban Commuter",
    description: "Typical driver with regular grocery runs.",
    badge: "Moderate 🥀",
    color:
      "from-amber-500/10 to-orange-600/10 hover:from-amber-500/20 border-amber-500/30 text-amber-400",
    transactions: [
      { date: "2026-06-15", merchant: "Whole Foods", amount: 135, category: "Groceries" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-16", merchant: "Chevron", amount: 55.4, category: "Fuel" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-17", merchant: "Target", amount: 64, category: "Groceries" as const, source: "seed" as const, confidence: 0.9 },
      { date: "2026-06-18", merchant: "Netflix", amount: 22.99, category: "Entertainment" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-19", merchant: "Local Diner", amount: 34.5, category: "Restaurants & Services" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-20", merchant: "City Water & Power", amount: 85, category: "Utilities" as const, source: "seed" as const, confidence: 1 },
    ],
  },
  {
    name: "Green Pioneer",
    description: "Transit, thrift stores, and local farms.",
    badge: "Eco Warrior 🌳",
    color:
      "from-emerald-500/10 to-green-600/10 hover:from-emerald-500/20 border-green-500/30 text-emerald-400",
    transactions: [
      { date: "2026-06-15", merchant: "Local Farm Box", amount: 65, category: "Groceries" as const, source: "seed" as const, confidence: 0.95 },
      { date: "2026-06-16", merchant: "BART Pass", amount: 35, category: "Public Transit" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-17", merchant: "Thrift Closet", amount: 45, category: "Eco Goods" as const, source: "seed" as const, confidence: 0.9 },
      { date: "2026-06-18", merchant: "Patagonia Repair", amount: 75, category: "Eco Goods" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-19", merchant: "Spotify", amount: 14.99, category: "Entertainment" as const, source: "seed" as const, confidence: 1 },
      { date: "2026-06-20", merchant: "Arcadia Green Energy", amount: 40, category: "Eco Goods" as const, source: "seed" as const, confidence: 1 },
    ],
  },
];

export const SAMPLE_CSV = `Date,Merchant,Amount,Category
2026-06-18,Chevron Gas,54.50,Fuel
2026-06-18,Zara Apparel,120.00,Fast Fashion
2026-06-19,Whole Foods,141.20,Groceries
2026-06-19,H&M,45.00,Fast Fashion
2026-06-20,BART,8.50,Public Transit
2026-06-20,PG&E,165.00,Utilities
2026-06-21,Patagonia Repair,25.00,Eco Goods`;

export const RECEIPT_PRESETS = [
  {
    name: "Fuel Pump Receipt",
    emoji: "⛽",
    text: `SHELL SERVICE STATION #491024
2300 MOUNTAIN BLVD, OAKLAND CA
DATE: 06/19/2026  14:32:01
PUMP #4  87 REGULAR
22.40 GALLONS @ $4.10/GAL
TOTAL: $91.84`,
  },
  {
    name: "Fast Fashion Receipt",
    emoji: "🛍️",
    text: `H&M FASHION CO. #231
STREETS OF SF MALL
DATE: 2026-06-18 17:15
SYNTHETIC SWEATER    $39.99
POLYESTER SLACK      $45.00
SLIM FIT COTTON TEE  $15.00
SUBTOTAL: $99.99
TAX (8.5%): $8.50
TOTAL: $108.49`,
  },
  {
    name: "Organic Farm Co-op",
    emoji: "🥕",
    text: `LOCAL CO-OP FARM-BASKET
BERKELEY, CA — ZERO WASTE CERTIFIED
FARMERS BASKET (Lrg)   $45.00
ORGANIC BULK REFILLS   $12.50
BIODEGRADABLE SOAP     $8.50
TOTAL: $66.00`,
  },
];
