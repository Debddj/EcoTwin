"use client";

import { AlertTriangle } from "lucide-react";
import type { TwinStatus } from "@/types";

interface Props {
  status: TwinStatus;
}

export function StatsGrid({ status }: Props) {
  const { yearlyTonsEmitted, cedarsEquivalent } = status;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-5">
        <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">
          Yearly Footprint
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-light tracking-tight text-zinc-100">
            {yearlyTonsEmitted.toFixed(2)}
          </span>
          <span className="text-xs font-mono text-zinc-500">Tons CO₂e/yr</span>
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">
          US avg ≈ 14 tons/yr. Climate target: under 2 tons.
        </p>
      </div>

      <div className="glass rounded-2xl p-5">
        <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-2">
          Trees Saved / Year
        </p>
        {cedarsEquivalent > 0 ? (
          <div className="flex items-baseline gap-2 text-brand-400">
            <span className="text-4xl font-light tracking-tight">
              {cedarsEquivalent}
            </span>
            <span className="text-xs font-mono text-brand-400/70">
              Cedars
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-400 mt-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="text-xs">Footprint exceeds baseline. No trees saved yet.</span>
          </div>
        )}
        <p className="text-[11px] text-zinc-600 mt-2">
          Based on 22kg CO₂/tree/year sequestration.
        </p>
      </div>
    </div>
  );
}
