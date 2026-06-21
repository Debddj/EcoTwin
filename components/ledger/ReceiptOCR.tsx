"use client";

import { useState } from "react";
import { Camera, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCarbonStore } from "@/store/carbon-store";
import { EMISSION_FACTORS } from "@/lib/constants/emission-factors";
import { RECEIPT_PRESETS, SAMPLE_CSV } from "@/lib/constants/emission-factors";
import { parseCsvToTransactions } from "@/lib/utils/carbon";
import type { TransactionCategory } from "@/types";

export function ReceiptOCR() {
  const { addTransaction, addManyTransactions } = useCarbonStore();

  // OCR State
  const [receiptText, setReceiptText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Manual Entry State
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Groceries");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]!);

  // CSV State
  const [csvText, setCsvText] = useState("");

  const handleOCR = async () => {
    if (!receiptText.trim()) {
      toast.error("Paste receipt text or choose a preset first.");
      return;
    }

    setOcrLoading(true);
    try {
      const res = await fetch("/api/classify-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptText }),
      });

      const data = await res.json() as { success: boolean; result?: { merchant: string; amount: number; date: string; category: TransactionCategory; confidence: number }; error?: string };

      if (!data.success || !data.result) {
        throw new Error(data.error ?? "Classification failed.");
      }

      const tx = addTransaction({ ...data.result, source: "ocr" });
      setReceiptText("");
      setSelectedPreset(null);
      toast.success(
        `✓ ${tx.merchant} — ${tx.co2e.toFixed(1)} kgCO₂e classified as ${tx.category}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OCR failed.";
      toast.error(msg + " — Is the backend running?");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!merchant.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid merchant name and amount.");
      return;
    }
    const tx = addTransaction({ merchant, amount: amt, category, date, source: "manual", confidence: 1 });
    setMerchant("");
    setAmount("");
    toast.success(`Logged $${amt.toFixed(2)} at ${tx.merchant}!`);
  };

  const handleCSV = () => {
    const rows = parseCsvToTransactions(csvText);
    if (rows.length === 0) {
      toast.error("No valid rows found. Check CSV format.");
      return;
    }
    addManyTransactions(rows);
    setCsvText("");
    toast.success(`Imported ${rows.length} transactions.`);
  };

  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      {/* OCR Section */}
      <div>
        <h4 className="text-xs uppercase font-mono tracking-widest text-brand-400 font-bold mb-3">
          Gemini OCR Receipt Scan
        </h4>

        <div className="flex flex-col gap-1.5 mb-3">
          {RECEIPT_PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => { setSelectedPreset(i); setReceiptText(p.text); }}
              className={`text-left px-3 py-2 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                selectedPreset === i
                  ? "border-brand-500/50 bg-brand-500/10 text-brand-400"
                  : "border-surface-border bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
              }`}
            >
              <span className="font-semibold">{p.emoji} {p.name}</span>
              <span className="text-[9px] font-mono text-zinc-600">Load</span>
            </button>
          ))}
        </div>

        <textarea
          value={receiptText}
          onChange={(e) => setReceiptText(e.target.value)}
          placeholder="Paste receipt text or load a preset above..."
          rows={5}
          className="w-full bg-black/40 border border-surface-border rounded-xl p-3
            text-xs font-mono text-zinc-300 placeholder-zinc-700
            focus:border-brand-500/50 focus:outline-none resize-none"
        />

        <button
          onClick={handleOCR}
          disabled={ocrLoading}
          className="w-full mt-2 py-2.5 rounded-xl border border-brand-500/30
            bg-brand-500/10 text-brand-400 font-mono text-xs font-bold uppercase
            tracking-wider hover:bg-brand-500/20 transition-all
            disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {ocrLoading ? (
            <><RefreshCw className="animate-spin" size={13} /> Classifying...</>
          ) : (
            <><Camera size={13} /> Submit to Gemini</>
          )}
        </button>
      </div>

      {/* CSV Import */}
      <div className="border-t border-surface-border pt-4">
        <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-500 font-bold mb-2">
          CSV Statement Import
        </h4>
        <div className="flex gap-2">
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Date,Merchant,Amount,Category"
            rows={3}
            className="flex-1 bg-black/40 border border-surface-border rounded-xl p-2.5
              text-[10px] font-mono text-zinc-400 placeholder-zinc-700
              focus:border-brand-500/50 focus:outline-none resize-none"
          />
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setCsvText(SAMPLE_CSV)}
              className="px-2 py-1.5 text-[10px] rounded-lg bg-white/5 border border-surface-border text-zinc-400 hover:text-zinc-200"
            >
              Sample
            </button>
            <button
              onClick={handleCSV}
              className="flex-1 px-2.5 py-1.5 text-[10px] font-bold rounded-lg bg-brand-500 text-black hover:bg-brand-400 transition-colors"
            >
              Import
            </button>
          </div>
        </div>
        <p className="text-[10px] text-zinc-700 mt-1 font-mono">
          Format: Date, Merchant, Amount, Category
        </p>
      </div>

      {/* Manual Entry */}
      <div className="border-t border-surface-border pt-4">
        <h4 className="text-xs uppercase font-mono tracking-widest text-zinc-500 font-bold mb-3">
          Manual Entry
        </h4>
        <form onSubmit={handleManual} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] uppercase text-zinc-600 font-mono block mb-1">Merchant</label>
              <input
                type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Costco Gas"
                className="w-full bg-black/40 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:border-brand-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase text-zinc-600 font-mono block mb-1">Amount ($)</label>
              <input
                type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="42.50"
                className="w-full bg-black/40 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:border-brand-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] uppercase text-zinc-600 font-mono block mb-1">Category</label>
              <select
                value={category} onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full bg-zinc-900 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:border-brand-500/50 focus:outline-none"
              >
                {Object.keys(EMISSION_FACTORS).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase text-zinc-600 font-mono block mb-1">Date</label>
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900 border border-surface-border rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 focus:border-brand-500/50 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg border border-surface-border bg-white/5 hover:bg-white/10
              text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 transition-colors
              flex items-center justify-center gap-1.5"
          >
            <Plus size={12} /> Add to Ledger
          </button>
        </form>
      </div>
    </div>
  );
}
