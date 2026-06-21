"use client";

import { Layers, FileText, Sliders, MessageSquare } from "lucide-react";
import { useCarbonStore, type ActiveTab } from "@/store/carbon-store";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS: { tab: ActiveTab; icon: React.ElementType; label: string }[] = [
  { tab: "ecosystem", icon: Layers, label: "Ecosystem" },
  { tab: "ledger", icon: FileText, label: "Ledger" },
  { tab: "simulator", icon: Sliders, label: "Simulator" },
  { tab: "coach", icon: MessageSquare, label: "Coach" },
];

interface Props {
  twinScore: number;
}

export function Sidebar({ twinScore }: Props) {
  const { activeTab, setActiveTab } = useCarbonStore();

  return (
    <nav className="w-[72px] bg-surface-elevated border-r border-surface-border flex flex-col items-center py-6 justify-between shrink-0">
      {/* Logo */}
      <div className="flex flex-col items-center gap-8">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-700 border border-surface-border
            flex items-center justify-center text-xs font-black tracking-tight text-brand-400 select-none"
          title="EcoTwin"
        >
          ET
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-3 pt-2">
          {NAV_ITEMS.map(({ tab, icon: Icon, label }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              title={label}
              aria-label={label}
              aria-current={activeTab === tab ? "page" : undefined}
              className={cn(
                "relative p-2.5 rounded-xl transition-all duration-200 group",
                activeTab === tab
                  ? "bg-white/10 text-brand-400"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              {activeTab === tab && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand-400 rounded-r-full" />
              )}
              <Icon size={18} />

              {/* Tooltip */}
              <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-zinc-900 border border-surface-border text-xs px-2 py-1 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Score ring */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-9 h-9 rounded-full border border-surface-border flex items-center justify-center
            text-[11px] font-mono text-brand-400 font-bold"
          title="Eco Score"
        >
          {twinScore}
        </div>
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
          Score
        </span>
      </div>
    </nav>
  );
}
