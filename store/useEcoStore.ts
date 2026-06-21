import { create } from 'zustand';
import { Transaction, TransactionCategory, WhatIfState, CoachMessage, DemoPreset } from '@/types';
import { EMISSION_FACTORS, DEMO_PRESETS } from '@/lib/constants/emission-factors';

interface EcoState {
  // Navigation & UI tab state
  activeTab: 'ecosystem' | 'transactions' | 'simulator' | 'coach';
  setActiveTab: (tab: 'ecosystem' | 'transactions' | 'simulator' | 'coach') => void;

  // Transactions State
  transactions: Transaction[];
  setTransactions: (txs: Transaction[]) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'co2e' | 'createdAt'>) => Transaction;
  removeTransaction: (id: string) => void;
  clearLedger: () => void;
  loadPreset: (preset: DemoPreset) => void;
  importCSV: (rawText: string) => { success: boolean; count: number; error?: string };

  // What-If Simulator State
  simulator: WhatIfState;
  setSimulator: (updater: Partial<WhatIfState>) => void;
  resetSimulator: () => void;

  // EcoCoach Conversation State
  chatMessages: CoachMessage[];
  addChatMessage: (msg: Omit<CoachMessage, 'id' | 'timestamp'>) => void;
  chatInput: string;
  setChatInput: (input: string) => void;

  // Loading and error states
  ocrLoading: boolean;
  setOcrLoading: (val: boolean) => void;
  ocrError: string | null;
  setOcrError: (val: string | null) => void;

  coachLoading: boolean;
  setCoachLoading: (val: boolean) => void;
  coachError: string | null;
  setCoachError: (val: string | null) => void;

  // Local storage initialization
  initializeStore: () => void;
}

export const useEcoStore = create<EcoState>((set, get) => ({
  activeTab: 'ecosystem',
  setActiveTab: (activeTab) => set({ activeTab }),

  transactions: [],
  setTransactions: (transactions) => {
    set({ transactions });
    localStorage.setItem('ecotwin_transactions', JSON.stringify(transactions));
  },

  addTransaction: (txData) => {
    const co2 = txData.amount * EMISSION_FACTORS[txData.category].kgCo2ePerDollar;
    const newTx: Transaction = {
      ...txData,
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      co2e: co2,
      createdAt: Date.now()
    };
    
    const updated = [newTx, ...get().transactions];
    set({ transactions: updated });
    localStorage.setItem('ecotwin_transactions', JSON.stringify(updated));
    return newTx;
  },

  removeTransaction: (id) => {
    const updated = get().transactions.filter((t) => t.id !== id);
    set({ transactions: updated });
    localStorage.setItem('ecotwin_transactions', JSON.stringify(updated));
  },

  clearLedger: () => {
    set({
      transactions: [],
      simulator: {
        meatReduction: 0,
        carlessDays: 0,
        thermostatOffset: 0,
        secondHandPercent: 0
      }
    });
    localStorage.setItem('ecotwin_transactions', JSON.stringify([]));
  },

  loadPreset: (preset) => {
    const generated = preset.transactions.map((tx, i) => ({
      ...tx,
      id: `seed-${Date.now()}-${i}`,
      co2e: tx.amount * EMISSION_FACTORS[tx.category].kgCo2ePerDollar,
      createdAt: Date.now() - (preset.transactions.length - i) * 1000
    })) as Transaction[];
    
    set({
      transactions: generated,
      simulator: {
        meatReduction: 0,
        carlessDays: 0,
        thermostatOffset: 0,
        secondHandPercent: 0
      }
    });
    localStorage.setItem('ecotwin_transactions', JSON.stringify(generated));
  },

  importCSV: (rawText) => {
    if (!rawText.trim()) {
      return { success: false, count: 0, error: 'CSV content is empty.' };
    }

    try {
      const lines = rawText.trim().split('\n');
      const parsedTransactions: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;

        const parts = line.split(',');
        if (parts.length >= 3) {
          const date = parts[0]?.trim() || (new Date().toISOString().split('T')[0] as string);
          const merchant = parts[1]?.trim() || 'Unlisted Store';
          const amount = parseFloat(parts[2]?.trim() || '0');
          let category = (parts[3]?.trim() || 'Eco Goods') as TransactionCategory;

          if (!EMISSION_FACTORS[category]) {
            category = 'Eco Goods';
          }

          if (!isNaN(amount) && amount > 0) {
            const co2 = amount * EMISSION_FACTORS[category].kgCo2ePerDollar;
            parsedTransactions.push({
              id: `csv-${Date.now()}-${i}`,
              date,
              merchant,
              amount,
              category,
              co2e: co2,
              source: 'upload',
              confidence: 0.9,
              createdAt: Date.now() - i * 100
            });
          }
        }
      }

      if (parsedTransactions.length === 0) {
        return { success: false, count: 0, error: 'No valid transaction rows found in CSV.' };
      }

      const updated = [...parsedTransactions, ...get().transactions];
      set({ transactions: updated });
      localStorage.setItem('ecotwin_transactions', JSON.stringify(updated));
      return { success: true, count: parsedTransactions.length };
    } catch (e: any) {
      return { success: false, count: 0, error: 'Failed to read statement. Ensure columns align.' };
    }
  },

  simulator: {
    meatReduction: 0,
    carlessDays: 0,
    thermostatOffset: 0,
    secondHandPercent: 0
  },

  setSimulator: (updater) => set((state) => ({
    simulator: { ...state.simulator, ...updater }
  })),

  resetSimulator: () => set({
    simulator: {
      meatReduction: 0,
      carlessDays: 0,
      thermostatOffset: 0,
      secondHandPercent: 0
    }
  }),

  chatMessages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am EcoCoach, your carbon intelligence advisor. Connect your ledger, slide the green parameters, or upload a store receipt below, and I'll analyze specific habits for carbon reductions.",
      timestamp: Date.now()
    }
  ],

  addChatMessage: (msg) => {
    const newMsg: CoachMessage = {
      ...msg,
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now()
    };
    set((state) => ({ chatMessages: [...state.chatMessages, newMsg] }));
  },

  chatInput: '',
  setChatInput: (chatInput) => set({ chatInput }),

  ocrLoading: false,
  setOcrLoading: (ocrLoading) => set({ ocrLoading }),
  ocrError: null,
  setOcrError: (ocrError) => set({ ocrError }),

  coachLoading: false,
  setCoachLoading: (coachLoading) => set({ coachLoading }),
  coachError: null,
  setCoachError: (coachError) => set({ coachError }),

  initializeStore: () => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('ecotwin_transactions');
    if (cached) {
      set({ transactions: JSON.parse(cached) });
    } else {
      // Preload suburban commuter preset by default
      const defaultPreset = DEMO_PRESETS[1];
      if (defaultPreset) {
        const initialTxs = defaultPreset.transactions.map((t, idx) => ({
          ...t,
          id: `init-${idx}-${Date.now()}`,
          co2e: t.amount * EMISSION_FACTORS[t.category].kgCo2ePerDollar,
          source: 'seed',
          confidence: t.confidence || 1.0,
          createdAt: Date.now() - (defaultPreset.transactions.length - idx) * 1000
        })) as Transaction[];
        set({ transactions: initialTxs });
        localStorage.setItem('ecotwin_transactions', JSON.stringify(initialTxs));
      }
    }
  }
}));
