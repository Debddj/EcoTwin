"use client";

import { Database } from "lucide-react";

interface Props {
  transactionCount: number;
}

export function Header({ transactionCount }: Props) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 py-4 bg-surface/80 backdrop-blur-md border-b border-surface-border">
      <div>
        <h1 className="text-2xl font-light tracking-tight italic text-zinc-100">
          EcoTwin
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-400 font-semibold mt-0.5">
          Living Carbon Intelligence
        </p>
      </div>

      <div className="flex items-center gap-3 px-4 py-2 glass rounded-xl">
        <Database size={13} className="text-zinc-500" />
        <span className="text-[11px] font-mono text-zinc-400">
          Local Storage
        </span>
        <span className="text-zinc-700">|</span>
        <span className="text-[11px] font-mono text-brand-400">
          {transactionCount} transactions
        </span>
      </div>
    </header>
  );
}
