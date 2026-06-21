"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import type {
  Transaction,
  TransactionCategory,
  TransactionSource,
  WhatIfState,
  CoachMessage,
} from "@/types";
import { computeCO2e } from "@/lib/utils/carbon";
import { TransactionRepository } from "@/lib/storage/repository";
import { DEMO_PRESETS } from "@/lib/constants/emission-factors";

export type ActiveTab = "ecosystem" | "ledger" | "simulator" | "coach";

interface CarbonState {
  // Data
  transactions: Transaction[];
  simulator: WhatIfState;
  chatMessages: CoachMessage[];

  // UI
  activeTab: ActiveTab;
  isCoachLoading: boolean;
  coachError: string | null;

  // Actions — Transactions
  loadTransactions: () => void;
  addTransaction: (
    data: Omit<Transaction, "id" | "co2e" | "createdAt">
  ) => Transaction;
  addManyTransactions: (
    data: Array<Omit<Transaction, "id" | "co2e" | "createdAt">>
  ) => void;
  removeTransaction: (id: string) => void;
  loadPreset: (index: number) => void;
  clearAll: () => void;

  // Actions — Simulator
  setSimulator: (updates: Partial<WhatIfState>) => void;
  resetSimulator: () => void;

  // Actions — Coach
  addChatMessage: (msg: CoachMessage) => void;
  setCoachLoading: (v: boolean) => void;
  setCoachError: (err: string | null) => void;
  clearChat: () => void;

  // Actions — UI
  setActiveTab: (tab: ActiveTab) => void;
}

const DEFAULT_SIM: WhatIfState = {
  meatReduction: 0,
  carlessDays: 0,
  thermostatOffset: 0,
  secondHandPercent: 0,
};

const WELCOME_MSG: CoachMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Hi! I'm EcoCoach, your AI carbon advisor. Load transactions or a preset, then ask me anything — I'll give personalized, data-driven advice based on your actual spending.",
  timestamp: Date.now(),
};

export const useCarbonStore = create<CarbonState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      transactions: [],
      simulator: DEFAULT_SIM,
      chatMessages: [WELCOME_MSG],
      activeTab: "ecosystem",
      isCoachLoading: false,
      coachError: null,

      loadTransactions: () => {
        const stored = TransactionRepository.getAll();
        if (stored.length > 0) {
          set({ transactions: stored });
          return;
        }
        // Seed with "Suburban Commuter" preset on first load
        const preset = DEMO_PRESETS[1];
        if (!preset) return;
        const seeded: Transaction[] = preset.transactions.map((t) => ({
          ...t,
          id: uuid(),
          co2e: computeCO2e(t.amount, t.category as TransactionCategory),
          createdAt: Date.now(),
        }));
        TransactionRepository.save(seeded);
        set({ transactions: seeded });
      },

      addTransaction: (data) => {
        const tx: Transaction = {
          ...data,
          id: uuid(),
          co2e: computeCO2e(data.amount, data.category),
          createdAt: Date.now(),
        };
        const next = TransactionRepository.add(tx);
        set({ transactions: next });
        return tx;
      },

      addManyTransactions: (data) => {
        const txs: Transaction[] = data.map((d) => ({
          ...d,
          id: uuid(),
          co2e: computeCO2e(d.amount, d.category),
          createdAt: Date.now(),
        }));
        const next = TransactionRepository.addMany(txs);
        set({ transactions: next });
      },

      removeTransaction: (id) => {
        const next = TransactionRepository.remove(id);
        set({ transactions: next });
      },

      loadPreset: (index) => {
        const preset = DEMO_PRESETS[index];
        if (!preset) return;
        const txs: Transaction[] = preset.transactions.map((t) => ({
          ...t,
          id: uuid(),
          co2e: computeCO2e(t.amount, t.category as TransactionCategory),
          createdAt: Date.now(),
        }));
        TransactionRepository.save(txs);
        set({ transactions: txs, simulator: DEFAULT_SIM });
      },

      clearAll: () => {
        TransactionRepository.clear();
        set({ transactions: [] });
      },

      setSimulator: (updates) =>
        set((s) => ({ simulator: { ...s.simulator, ...updates } })),

      resetSimulator: () => set({ simulator: DEFAULT_SIM }),

      addChatMessage: (msg) =>
        set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

      setCoachLoading: (v) => set({ isCoachLoading: v }),

      setCoachError: (err) => set({ coachError: err }),

      clearChat: () => set({ chatMessages: [WELCOME_MSG] }),

      setActiveTab: (tab) => set({ activeTab: tab }),
    })),
    { name: "EcoTwin" }
  )
);
