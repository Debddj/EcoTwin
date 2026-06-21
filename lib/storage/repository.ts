import type { Transaction } from "@/types";

const STORAGE_KEY = "ecotwin:transactions:v2";

/**
 * Repository pattern — swap this implementation for any DB
 * by changing only this file. API surface stays identical.
 */
export const TransactionRepository = {
  getAll(): Transaction[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed as Transaction[];
    } catch {
      return [];
    }
  },

  save(transactions: Transaction[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  },

  add(tx: Transaction): Transaction[] {
    const all = this.getAll();
    const next = [tx, ...all];
    this.save(next);
    return next;
  },

  addMany(txs: Transaction[]): Transaction[] {
    const all = this.getAll();
    const next = [...txs, ...all];
    this.save(next);
    return next;
  },

  remove(id: string): Transaction[] {
    const next = this.getAll().filter((t) => t.id !== id);
    this.save(next);
    return next;
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
