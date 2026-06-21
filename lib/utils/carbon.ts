import { EMISSION_FACTORS } from "@/lib/constants/emission-factors";
import type {
  Transaction,
  TwinStatus,
  WhatIfState,
  TransactionCategory,
} from "@/types";

const DAILY_BASELINE_KG = 13.5;
const TREE_SEQUESTRATION_KG_PER_YEAR = 22;

export function computeCO2e(
  amount: number,
  category: TransactionCategory
): number {
  return amount * (EMISSION_FACTORS[category]?.kgCo2ePerDollar ?? 0);
}

export function calculateTwinStatus(
  transactions: Transaction[],
  sim: WhatIfState
): TwinStatus {
  if (transactions.length === 0) {
    return {
      state: "sapling",
      score: 72,
      carbonAverage: 4.2,
      weeklyTotal: 0,
      trend: "stable",
      trendPercent: 0,
      yearlyTonsEmitted: 1.53,
      cedarsEquivalent: 0,
    };
  }

  let totalSimulated = 0;

  for (const tx of transactions) {
    let factor = 1.0;

    switch (tx.category) {
      case "Groceries":
        factor = 1.0 - (sim.meatReduction / 100) * 0.45;
        break;
      case "Fuel":
        factor = 1.0 - sim.carlessDays / 7;
        break;
      case "Utilities":
        factor = 1.0 - sim.thermostatOffset * 0.04;
        break;
      case "Fast Fashion":
        factor = 1.0 - (sim.secondHandPercent / 100) * 0.9;
        break;
    }

    totalSimulated += tx.co2e * Math.max(0, factor);
  }

  const daySpan = Math.max(1, Math.ceil(transactions.length / 1.5));
  const carbonAverage = totalSimulated / daySpan;
  const pctDiff =
    ((carbonAverage - DAILY_BASELINE_KG) / DAILY_BASELINE_KG) * 100;

  const trend =
    pctDiff < -5 ? "improving" : pctDiff > 5 ? "worsening" : "stable";

  const score = Math.max(12, Math.min(100, Math.round(100 - carbonAverage * 3.5)));

  const state =
    score >= 82
      ? "thriving"
      : score >= 55
        ? "sapling"
        : score >= 32
          ? "wilting"
          : "drought";

  const yearlyTonsEmitted = (carbonAverage * 365) / 1000;
  const savedVsBaseline = (DAILY_BASELINE_KG - carbonAverage) * 365;
  const cedarsEquivalent = Math.max(
    0,
    Math.round(savedVsBaseline / TREE_SEQUESTRATION_KG_PER_YEAR)
  );

  return {
    state,
    score,
    carbonAverage,
    weeklyTotal: totalSimulated,
    trend,
    trendPercent: Math.abs(Math.round(pctDiff)),
    yearlyTonsEmitted,
    cedarsEquivalent,
  };
}

export function parseCsvToTransactions(
  rawCsv: string
): Array<Omit<Transaction, "id" | "co2e" | "createdAt">> {
  const lines = rawCsv.trim().split("\n");
  const results: Array<Omit<Transaction, "id" | "co2e" | "createdAt">> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    const parts = line.split(",");
    const date = parts[0]?.trim() ?? new Date().toISOString().split("T")[0]!;
    const merchant = parts[1]?.trim() ?? "Unknown Merchant";
    const amount = parseFloat(parts[2]?.trim() ?? "0");
    const rawCat = parts[3]?.trim() as TransactionCategory;
    const category =
      rawCat && EMISSION_FACTORS[rawCat] ? rawCat : "Eco Goods";

    if (!isNaN(amount) && amount > 0) {
      results.push({
        date,
        merchant,
        amount,
        category,
        source: "upload",
        confidence: 0.9,
      });
    }
  }

  return results;
}
