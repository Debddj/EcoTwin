"use client";

import { useState } from "react";
import { Trash2, History, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCarbonStore } from "@/store/carbon-store";
import { EMISSION_FACTORS } from "@/lib/constants/emission-factors";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  transactions: Transaction[];
}

const SOURCE_LABEL: Record<Transaction["source"], string> = {
  ocr: "📷 Gemini OCR",
  upload: "📁 CSV Upload",
  seed: "🚀 Preset",
  manual: "✍️ Manual",
};

export function TransactionTable({ transactions }: Props) {
  const { removeTransaction, clearAll } = useCarbonStore();
  const [sortKey, setSortKey] = useState<"date" | "co2e" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...transactions].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") {
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    return sortDir === "asc"
      ? (av as number) - (bv as number)
      : (bv as number) - (av as number);
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const handleRemove = (id: string, merchant: string) => {
    removeTransaction(id);
    toast.success(`Removed: ${merchant}`);
  };

  const handleClear = () => {
    if (confirm("Wipe all transactions? Your twin will reset.")) {
      clearAll();
      toast.info("Ledger cleared.");
    }
  };

  const SortHeader = ({ label, col }: { label: string; col: typeof sortKey }) => (
    <th
      className="py-3 px-4 cursor-pointer select-none hover:text-zinc-300 transition-colors"
      onClick={() => toggleSort(col)}
    >
      {label} {sortKey === col ? (sortDir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  return (
    <section className="glass rounded-3xl overflow-hidden">
      <div className="flex justify-between items-center px-6 py-4 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <History size={15} className="text-brand-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-300">
            Transaction Ledger
          </h3>
          <span className="text-[10px] font-mono text-zinc-600 ml-1">
            ({transactions.length} rows)
          </span>
        </div>

        <button
          onClick={handleClear}
          disabled={transactions.length === 0}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-900/40
            bg-red-950/20 text-red-400 hover:bg-red-950/40 transition-all
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Wipe Ledger
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-600 font-mono text-[10px] uppercase border-b border-surface-border">
              <th className="py-3 px-4 text-left">Source</th>
              <SortHeader label="Date" col="date" />
              <th className="py-3 px-4 text-left">Merchant</th>
              <SortHeader label="Amount" col="amount" />
              <th className="py-3 px-4 text-left">Category</th>
              <SortHeader label="CO₂e" col="co2e" />
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {sorted.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-white/[0.015] transition-colors"
              >
                <td className="py-3 px-4 font-mono text-[10px] text-zinc-600">
                  {SOURCE_LABEL[tx.source]}
                </td>
                <td className="py-3 px-4 font-mono text-zinc-400">{tx.date}</td>
                <td className="py-3 px-4 font-semibold text-zinc-200">{tx.merchant}</td>
                <td className="py-3 px-4 font-mono text-zinc-400">
                  ${tx.amount.toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      EMISSION_FACTORS[tx.category]?.color ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
                    )}
                  >
                    {tx.category}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-semibold">
                  <span
                    className={
                      tx.co2e > 70
                        ? "text-red-400"
                        : tx.co2e > 20
                          ? "text-amber-400"
                          : "text-brand-400"
                    }
                  >
                    {tx.co2e.toFixed(1)} kg
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleRemove(tx.id, tx.merchant)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/20 transition-all"
                    aria-label={`Remove ${tx.merchant}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="py-12 text-center border border-dashed border-surface-border m-4 rounded-2xl">
            <AlertTriangle className="mx-auto mb-3 text-zinc-700" size={24} />
            <p className="text-sm text-zinc-500">Ledger is empty.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Select a preset above or upload receipts to start.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
