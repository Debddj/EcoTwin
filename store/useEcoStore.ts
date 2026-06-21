import { create } from 'zustand';
import { Transaction, TransactionCategory, WhatIfState, CoachMessage, DemoPreset } from '@/types';
import { DEMO_PRESETS } from '@/lib/constants/emission-factors';
import { computeCO2e, parseCsvToTransactions } from '@/lib/utils/carbon';
import { TransactionRepository } from '@/lib/storage/repository';

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
    TransactionRepository.save(transactions);
  },

  addTransaction: (txData) => {
    const co2 = computeCO2e(txData.amount, txData.category);
    const newTx: Transaction = {
      ...txData,
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      co2e: co2,
      createdAt: Date.now()
    };
    
    const updated = TransactionRepository.add(newTx);
    set({ transactions: updated });
    return newTx;
  },

  removeTransaction: (id) => {
    const updated = TransactionRepository.remove(id);
    set({ transactions: updated });
  },

  clearLedger: () => {
    TransactionRepository.clear();
    set({
      transactions: [],
      simulator: {
        meatReduction: 0,
        carlessDays: 0,
        thermostatOffset: 0,
        secondHandPercent: 0
      }
    });
  },

  loadPreset: (preset) => {
    const generated = preset.transactions.map((tx, i) => ({
      ...tx,
      id: `seed-${Date.now()}-${i}`,
      co2e: computeCO2e(tx.amount, tx.category),
      createdAt: Date.now() - (preset.transactions.length - i) * 1000
    })) as Transaction[];
    
    TransactionRepository.save(generated);
    set({
      transactions: generated,
      simulator: {
        meatReduction: 0,
        carlessDays: 0,
        thermostatOffset: 0,
        secondHandPercent: 0
      }
    });
  },

  importCSV: (rawText) => {
    if (!rawText.trim()) {
      return { success: false, count: 0, error: 'CSV content is empty.' };
    }

    try {
      const parsed = parseCsvToTransactions(rawText);
      if (parsed.length === 0) {
        return { success: false, count: 0, error: 'No valid transaction rows found in CSV.' };
      }

      const generated = parsed.map((tx, i) => ({
        ...tx,
        id: `csv-${Date.now()}-${i}`,
        co2e: computeCO2e(tx.amount, tx.category),
        createdAt: Date.now() - i * 100
      })) as Transaction[];

      const updated = TransactionRepository.addMany(generated);
      set({ transactions: updated });
      return { success: true, count: generated.length };
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
    const cached = TransactionRepository.getAll();
    if (cached.length > 0) {
      set({ transactions: cached });
    } else {
      // Preload suburban commuter preset by default
      const defaultPreset = DEMO_PRESETS[1];
      if (defaultPreset) {
        const initialTxs = defaultPreset.transactions.map((t, idx) => ({
          ...t,
          id: `init-${idx}-${Date.now()}`,
          co2e: computeCO2e(t.amount, t.category),
          source: 'seed' as const,
          confidence: t.confidence || 1.0,
          createdAt: Date.now() - (defaultPreset.transactions.length - idx) * 1000
        })) as Transaction[];
        TransactionRepository.save(initialTxs);
        set({ transactions: initialTxs });
      }
    }
  }
}));
