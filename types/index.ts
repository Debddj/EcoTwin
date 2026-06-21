/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionCategory =
  | 'Fuel'
  | 'Flights'
  | 'Groceries'
  | 'Fast Fashion'
  | 'Utilities'
  | 'Public Transit'
  | 'Restaurants & Services'
  | 'Entertainment'
  | 'Eco Goods';

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: TransactionCategory;
  co2e: number; // kgCO2e computed automatically
  source: 'upload' | 'manual' | 'ocr' | 'seed';
  confidence: number; // For AI-categorization (0 to 1)
}

export interface EmissionFactor {
  category: TransactionCategory;
  kgCo2ePerDollar: number;
  label: string;
  icon: string;
  color: string;
  tip: string;
}

export type TwinMoodState = 'sapling' | 'thriving' | 'wilting' | 'drought';

export interface TwinStatus {
  state: TwinMoodState;
  score: number; // 0 (Worst/Drought) to 100 (Best/Thriving)
  carbonAverage: number; // average kg/day
  weeklyTotal: number;
  trend: 'improving' | 'stable' | 'worsening';
  trendPercent: number; // percentage change compared to baseline
}

export interface WhatIfState {
  meatReduction: number; // 0 to 100 % reduction
  carlessDays: number; // 0 to 7 days fewer driving
  thermostatOffset: number; // 0 to 5 degrees adjustment
  secondHandPercent: number; // 0 to 100% fast fashion replaced by thrift
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DemoPreset {
  name: string;
  description: string;
  badge: string;
  color: string;
  transactions: Omit<Transaction, 'id' | 'co2e'>[];
}
