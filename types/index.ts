export type TransactionCategory =
  | "Fuel"
  | "Flights"
  | "Groceries"
  | "Fast Fashion"
  | "Utilities"
  | "Public Transit"
  | "Restaurants & Services"
  | "Entertainment"
  | "Eco Goods";

export type TransactionSource = "upload" | "manual" | "ocr" | "seed";

export type TwinMoodState = "sapling" | "thriving" | "wilting" | "drought";

export type TrendDirection = "improving" | "stable" | "worsening";

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: TransactionCategory;
  co2e: number;
  source: TransactionSource;
  confidence: number;
  createdAt: number; // unix timestamp for sorting
}

export interface TwinStatus {
  state: TwinMoodState;
  score: number;
  carbonAverage: number;
  weeklyTotal: number;
  trend: TrendDirection;
  trendPercent: number;
  yearlyTonsEmitted: number;
  cedarsEquivalent: number;
}

export interface EmissionFactor {
  category: TransactionCategory;
  kgCo2ePerDollar: number;
  label: string;
  color: string;
  hexColor: string;
  tip: string;
}

export interface WhatIfState {
  meatReduction: number;
  carlessDays: number;
  thermostatOffset: number;
  secondHandPercent: number;
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface DemoPreset {
  name: string;
  description: string;
  badge: string;
  color: string;
  transactions: Omit<Transaction, "id" | "co2e" | "createdAt">[];
}

export interface ClassifyReceiptRequest {
  receiptText?: string;
  imageBase64?: string;
  imageMime?: string;
}

export interface ClassifyReceiptResult {
  merchant: string;
  amount: number;
  date: string;
  category: TransactionCategory;
  confidence: number;
}

export interface EcoCoachRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  transactionHistory: Array<{
    merchant: string;
    amount: number;
    category: string;
    co2e: number;
  }>;
}
