"use client";

import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, Leaf, Flame } from "lucide-react";
import type { TwinStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  status: TwinStatus;
}

const STATE_CONFIG = {
  sapling: {
    emoji: "🌱",
    label: "Vibrant & Sprouting",
    desc: "A young sapling. Keep emissions low to grow into a thriving ecosystem.",
    borderColor: "border-emerald-500/20",
    glowClass: "glow-green",
    barColor: "bg-teal-400",
    foliage: "#10B981",
  },
  thriving: {
    emoji: "🌳",
    label: "Lush & Thriving Forest",
    desc: "Well below baseline thresholds. A rich carbon-absorbing canopy.",
    borderColor: "border-brand-500/30",
    glowClass: "glow-green",
    barColor: "bg-brand-500",
    foliage: "#059669",
  },
  wilting: {
    emoji: "🥀",
    label: "Wilting & Weakened",
    desc: "Above optimal limits. Leaves drying — initiate green actions now.",
    borderColor: "border-amber-500/20",
    glowClass: "",
    barColor: "bg-amber-500",
    foliage: "#D97706",
  },
  drought: {
    emoji: "🏜️",
    label: "Arid Drought Crisis",
    desc: "Emissions dangerously high. Ground scorched, leaves gone.",
    borderColor: "border-red-500/20",
    glowClass: "",
    barColor: "bg-red-500",
    foliage: "#B45309",
  },
} as const;

export function TwinAvatar({ status }: Props) {
  const { state, score, trend, trendPercent, carbonAverage } = status;
  const cfg = STATE_CONFIG[state];

  return (
    <div
      className={cn(
        "rounded-3xl p-6 glass border transition-all duration-700 relative overflow-hidden",
        cfg.borderColor,
        cfg.glowClass
      )}
    >
      {/* Atmosphere effects */}
      {state === "thriving" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute rounded-full bg-brand-500/10 blur-3xl w-48 h-48 -left-12 -top-12"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500">
            Living Digital Twin
          </span>
          <h3 className="text-xl font-semibold text-zinc-100 mt-1 flex items-center gap-2">
            {cfg.emoji} {cfg.label}
          </h3>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono text-zinc-500">7d Trend</span>
          <div className="mt-1">
            {trend === "improving" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                <Sparkles size={11} /> +{trendPercent}% Cleaner
              </span>
            ) : trend === "worsening" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                <AlertTriangle size={11} /> +{trendPercent}% Carbon
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 border border-surface-border">
                Stable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SVG Stage */}
      <div className="h-56 flex items-center justify-center relative mb-6">
        <TwinSVG state={state} foliage={cfg.foliage} />
        <div className="absolute right-3 bottom-3 px-3 py-1.5 rounded-xl glass text-center">
          <div className="text-[9px] font-mono text-zinc-500 uppercase">
            Eco-Score
          </div>
          <div className="text-lg font-mono font-bold text-zinc-100">
            {score}/100
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 mb-4 relative z-10">{cfg.desc}</p>

      {/* Vitality bar */}
      <div className="space-y-1 relative z-10">
        <div className="flex justify-between text-xs font-mono text-zinc-500">
          <span>Vitality</span>
          <span>{score}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", cfg.barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mt-4 relative z-10">
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-zinc-500">Daily Avg</div>
          <div className="text-sm font-mono font-bold text-zinc-200 mt-0.5">
            {carbonAverage.toFixed(1)} kg/day
          </div>
        </div>
        <div className="glass rounded-xl p-3 text-center">
          <div className="text-[10px] font-mono text-zinc-500">Status</div>
          <div className="text-sm font-semibold text-zinc-200 flex items-center justify-center gap-1 mt-0.5">
            {state === "thriving" && <><Sparkles size={12} className="text-yellow-400" /> Healthy Air</>}
            {state === "sapling" && <><Leaf size={12} className="text-teal-400" /> Clean Soil</>}
            {state === "wilting" && <><AlertTriangle size={12} className="text-amber-500" /> Heavy Load</>}
            {state === "drought" && <><Flame size={12} className="text-red-500" /> Dry Burn</>}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pure SVG — extracted for clarity
function TwinSVG({ state, foliage }: { state: keyof typeof STATE_CONFIG; foliage: string }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full max-h-[220px]">
      <path
        d="M 20 170 Q 100 155 180 170"
        fill="none"
        stroke={state === "drought" ? "#D97706" : state === "wilting" ? "#8F7865" : "#8B5A2B"}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {state === "sapling" && (
        <>
          <path d="M 70 170 Q 100 145 130 170 Z" fill="#5C4033" />
          <motion.path
            d="M 100 160 Q 95 120 110 90"
            fill="none" stroke={foliage} strokeWidth="5" strokeLinecap="round"
            animate={{ d: ["M 100 160 Q 95 120 110 90", "M 100 160 Q 98 120 108 90", "M 100 160 Q 95 120 110 90"] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <path d="M 110 90 Q 125 80 128 92 Q 115 98 110 90 Z" fill={foliage} />
          <path d="M 103 115 Q 85 110 82 118 Q 98 123 103 115 Z" fill={foliage} />
        </>
      )}

      {state === "thriving" && (
        <>
          <path d="M 100 170 L 100 115" stroke="#5C4033" strokeWidth="10" strokeLinecap="round" />
          <path d="M 100 140 Q 80 125 70 120" fill="none" stroke="#5C4033" strokeWidth="5" strokeLinecap="round" />
          <path d="M 100 130 Q 120 115 130 110" fill="none" stroke="#5C4033" strokeWidth="5" strokeLinecap="round" />
          <circle cx="70" cy="110" r="28" fill="#047857" opacity="0.9" />
          <circle cx="130" cy="100" r="30" fill="#065F46" opacity="0.9" />
          <motion.circle cx="100" cy="82" r="36" fill={foliage}
            animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 4, repeat: Infinity }} />
          <motion.circle cx="72" cy="106" r="22" fill="#34D399"
            animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 5, repeat: Infinity, delay: 0.3 }} />
          <motion.circle cx="128" cy="96" r="24" fill="#059669"
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4.5, repeat: Infinity, delay: 0.6 }} />
          <circle cx="90" cy="68" r="2" fill="#FCD34D" opacity="0.9" />
          <circle cx="115" cy="82" r="2" fill="#FCD34D" opacity="0.9" />
        </>
      )}

      {state === "wilting" && (
        <>
          <path d="M 100 170 L 100 110" stroke="#6E6E6E" strokeWidth="7" strokeLinecap="round" />
          <path d="M 100 135 Q 82 125 75 120" fill="none" stroke="#6E6E6E" strokeWidth="4" strokeLinecap="round" />
          <path d="M 100 120 Q 118 112 125 105" fill="none" stroke="#6E6E6E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="70" cy="115" r="14" fill={foliage} opacity="0.85" />
          <circle cx="120" cy="102" r="16" fill="#F59E0B" opacity="0.85" />
          <circle cx="95" cy="85" r="18" fill="#B45309" opacity="0.9" />
          <motion.polygon points="115,118 119,123 113,126 111,121" fill={foliage}
            animate={{ y: [0, 30], opacity: [1, 0] }} transition={{ duration: 3.5, repeat: Infinity }} />
        </>
      )}

      {state === "drought" && (
        <>
          <path d="M 100 170 L 100 115" stroke="#4A3B32" strokeWidth="7" strokeLinecap="round" />
          <path d="M 100 115 Q 88 95 78 88" fill="none" stroke="#4A3B32" strokeWidth="4" strokeLinecap="round" />
          <path d="M 100 115 Q 112 95 124 88" fill="none" stroke="#4A3B32" strokeWidth="4" strokeLinecap="round" />
          <path d="M 100 142 L 80 138" fill="none" stroke="#4A3B32" strokeWidth="3" strokeLinecap="round" />
          <motion.path
            d="M 30 70 Q 100 50 170 70"
            fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="3"
            animate={{ d: ["M 30 70 Q 100 50 170 70", "M 30 65 Q 100 55 170 65", "M 30 70 Q 100 50 170 70"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          {[1, 2, 3].map((i) => (
            <motion.circle key={i} cx={50 + i * 30} cy={175} r="1.5" fill="#F59E0B"
              animate={{ y: [-5, -60], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.6 }} />
          ))}
        </>
      )}
    </svg>
  );
}
