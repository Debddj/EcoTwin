"use client";

import { useCarbonStore } from "@/store/carbon-store";
import { DEMO_PRESETS } from "@/lib/constants/emission-factors";
import { Layers } from "lucide-react";

export function PresetSelector() {
  const { loadPreset } = useCarbonStore();

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Layers size={13} className="text-zinc-500" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">
          Demo Presets
        </h3>
        <span className="ml-auto text-[9px] text-zinc-700 font-mono">
          Instantly seed carbon states
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DEMO_PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => loadPreset(i)}
            className={`text-left p-3 rounded-xl border bg-gradient-to-br transition-all duration-300 ${preset.color}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold">{preset.name}</span>
              <span className="text-[10px] font-mono font-semibold">
                {preset.badge}
              </span>
            </div>
            <p className="text-[11px] opacity-60 leading-relaxed line-clamp-2">
              {preset.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
