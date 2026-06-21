import { EmissionFactor, DemoPreset, TransactionCategory } from '../types';

export const EMISSION_FACTORS: Record<TransactionCategory, EmissionFactor> = {
  'Fuel': {
    category: 'Fuel',
    kgCo2ePerDollar: 0.82,
    label: 'Gasoline & Fuel',
    icon: 'Fuel',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    tip: 'Fuel emissions are the highest daily contributor. Try carpooling, biking, or choosing rail transportation.'
  },
  'Flights': {
    category: 'Flights',
    kgCo2ePerDollar: 1.25,
    label: 'Aviation & Flights',
    icon: 'Plane',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    tip: 'Flight emissions are catastrophic for personal budgets. Consider trains for regional travel or buy direct carbon-offset certificates.'
  },
  'Groceries': {
    category: 'Groceries',
    kgCo2ePerDollar: 0.22,
    label: 'Food & Groceries',
    icon: 'ShoppingCart',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    tip: 'Grocery footprints rely on meat density. Swapping beef for beans or poultry is an easy 40%+ reduction.'
  },
  'Fast Fashion': {
    category: 'Fast Fashion',
    kgCo2ePerDollar: 0.45,
    label: 'Apparel & Fashion',
    icon: 'Shirt',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
    tip: 'Fast fashion chain garments are synthesized from petrochemicals. Support second-hand thrifting or purchase durable organic lines.'
  },
  'Utilities': {
    category: 'Utilities',
    kgCo2ePerDollar: 0.65,
    label: 'Home Heating & Utilities',
    icon: 'Zap',
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
    tip: 'Heating, gas, and grid grids. Lowering your thermostat by 2 degrees in winter saves up to 10% on energy emissions.'
  },
  'Public Transit': {
    category: 'Public Transit',
    kgCo2ePerDollar: 0.12,
    label: 'Buses, Trains & Subway',
    icon: 'Train',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
    tip: 'Mass transit is 80% cleaner than individual cars. Keep using subways or commuter rail systems!'
  },
  'Restaurants & Services': {
    category: 'Restaurants & Services',
    kgCo2ePerDollar: 0.18,
    label: 'Dining & Food Services',
    icon: 'UtensilsCursor',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900',
    tip: 'Restaurant waste and overhead contribute light footprints. Prefer restaurants with farm-to-table practices.'
  },
  'Entertainment': {
    category: 'Entertainment',
    kgCo2ePerDollar: 0.08,
    label: 'Streaming & Recreation',
    icon: 'Film',
    color: 'bg-stone-100 text-stone-800 border-stone-300 dark:bg-stone-900/40 dark:text-stone-300 dark:border-stone-800',
    tip: 'Low-impact digital activity or walks. Truly carbon-mindful entertainment.'
  },
  'Eco Goods': {
    category: 'Eco Goods',
    kgCo2ePerDollar: 0.04,
    label: 'Sustainable & Green Goods',
    icon: 'Sparkles',
    color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
    tip: 'Zero-waste refills, solar credits, and validated offset programs. Keeps emissions to the bare minimum.'
  }
};

export const DEMO_PRESETS: DemoPreset[] = [
  {
    name: 'Frequent Flyer / Jet-Setter',
    description: 'A carbon heavy lifestyle with weekly flights, premium gas fill-ups, and luxury retail therapy.',
    badge: 'High Impact 🏜️',
    color: 'from-rose-500/10 to-red-600/10 hover:from-rose-500/20 hover:to-red-600/20 border-red-500/30 text-rose-500',
    transactions: [
      { date: '2026-06-15', merchant: 'Delta Air Lines', amount: 480.0, category: 'Flights', source: 'seed', confidence: 1.0 },
      { date: '2026-06-16', merchant: 'Shell Gasoline', amount: 72.5, category: 'Fuel', source: 'seed', confidence: 1.0 },
      { date: '2026-06-17', merchant: 'Zara Fast Fashion', amount: 185.0, category: 'Fast Fashion', source: 'seed', confidence: 0.95 },
      { date: '2026-06-18', merchant: 'Ruth Steakhouse Outing', amount: 120.0, category: 'Restaurants & Services', source: 'seed', confidence: 1.0 },
      { date: '2026-06-19', merchant: 'Shell Gasoline Fill', amount: 68.0, category: 'Fuel', source: 'seed', confidence: 0.98 },
      { date: '2026-06-20', merchant: 'Pacific Gas & Electric', amount: 140.0, category: 'Utilities', source: 'seed', confidence: 1.0 }
    ]
  },
  {
    name: 'Standard Suburban Commuter',
    description: 'Typical daily driver doing regular grocery runs, standard home utilities, and light weekend activities.',
    badge: 'Moderate Impact 🥀',
    color: 'from-amber-500/10 to-orange-600/10 hover:from-amber-500/20 hover:to-orange-600/20 border-amber-500/30 text-amber-500',
    transactions: [
      { date: '2026-06-15', merchant: 'Whole Foods Market', amount: 135.0, category: 'Groceries', source: 'seed', confidence: 1.0 },
      { date: '2026-06-16', merchant: 'Cheveron Fueling Station', amount: 55.4, category: 'Fuel', source: 'seed', confidence: 1.0 },
      { date: '2026-06-17', merchant: 'Target Department Store', amount: 64.0, category: 'Groceries', source: 'seed', confidence: 0.9 },
      { date: '2026-06-18', merchant: 'Netflix Subscription', amount: 22.99, category: 'Entertainment', source: 'seed', confidence: 1.0 },
      { date: '2026-06-19', merchant: 'Local Burger Diner', amount: 34.5, category: 'Restaurants & Services', source: 'seed', confidence: 1.0 },
      { date: '2026-06-20', merchant: 'Municipal City Water & Power', amount: 85.0, category: 'Utilities', source: 'seed', confidence: 1.0 }
    ]
  },
  {
    name: 'Green Pioneer / Active Eco-Citizen',
    description: 'Swapped driving for the commuter train, thrift stores for outfits, and coordinates grocery local boxes.',
    badge: 'Eco Warrior 🌳',
    color: 'from-emerald-500/10 to-green-600/10 hover:from-emerald-500/20 hover:to-green-600/20 border-green-500/30 text-emerald-500',
    transactions: [
      { date: '2026-06-15', merchant: 'Local Farmers Basket', amount: 65.0, category: 'Groceries', source: 'seed', confidence: 0.95 },
      { date: '2026-06-16', merchant: 'BART Transit Pass', amount: 35.0, category: 'Public Transit', source: 'seed', confidence: 1.0 },
      { date: '2026-06-17', merchant: 'Thrift Store Vintage Closet', amount: 45.0, category: 'Eco Goods', source: 'seed', confidence: 0.9 },
      { date: '2026-06-18', merchant: 'Patagonia repaired wornwear', amount: 75.0, category: 'Eco Goods', source: 'seed', confidence: 1.0 },
      { date: '2026-06-19', merchant: 'Spotify Music Stream', amount: 14.99, category: 'Entertainment', source: 'seed', confidence: 1.0 },
      { date: '2026-06-20', merchant: 'Arcadia Green Energy Option', amount: 40.0, category: 'Eco Goods', source: 'seed', confidence: 1.0 }
    ]
  }
];

// Content templates for testing CSV import directly
export const SAMPLE_CSV_CONTENT = `Date,Merchant,Amount,Category,Source
2026-06-18,Chevron Gas Station,54.50,Fuel,CSV
2026-06-18,Zara Apparel,120.00,Fast Fashion,CSV
2026-06-19,Supermarket Grocer,141.20,Groceries,CSV
2026-06-19,H&M Jeans,45.00,Fast Fashion,CSV
2026-06-20,BART Subway,8.50,Public Transit,CSV
2026-06-20,Pacific Electric Heat,165.00,Utilities,CSV
2026-06-21,Patagonia repair,25.00,Eco Goods,CSV`;

// Sample preloaded thermal receipt texts to let judges test OCR with 1-click
export const SAMPLE_RECEIPT_PRESETS = [
  {
    name: "Regular Fuel Pump Receipt",
    emoji: "⛽",
    text: `SHELL SERVICE STATION #491024
2300 MOUNTAIN BLVD, OAKLAND CA 
DATE: 06/19/2026  14:32:01
PUMP #4  87 REGULAR
22.40 GALLONS @ $4.10/GAL
TOTAL AMOUNT PAID: $91.84
THANK YOU FOR YOUR PATRONAGE`
  },
  {
    name: "Fast Fashion Mall Receipt",
    emoji: "🛍️",
    text: `H&M FAST FASHION CO. #231
STREES OF SAN FRANCISCO MALL
REG: 04  OP: 421  TRANS: 8821
DATE: 2026-06-18 17:15
* SYNTHETIC SWEATER  $39.99
* POLYESTER SLACK    $45.00
* SLIM FIT COTTON TEE $15.00
SUBTOTAL: $99.99
TAX (8.5%): $8.50
TOTAL PAID: $108.49`
  },
  {
    name: "Co-Op Organic Farmer Receipt",
    emoji: "🥕",
    text: `LOCAL COOPERATIVE FARM-BASKET
100% ORGANIC & LOCAL CO-OP
BERKELEY, CA
1 X FARMERS BASKET (Lrg)  $45.00
3 X ORGANIC REFILL BULK   $12.50
1 X DEGRADABLE SOAP BAR   $8.50
TOTAL PAID: $66.00
ZERO WASTE CERTIFIED COOP`
  }
];
