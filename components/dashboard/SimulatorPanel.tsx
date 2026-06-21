"use client";

import { useCarbonStore } from "@/store/carbon-store";
import { calculateTwinStatus } from "@/lib/utils/carbon";

const SLIDERS = [
  {
    key: "meatReduction" as const,
    label: "Cut Red Meat",
    unit: (v: number) => `-${v}%`,
    min: 0, max: 100,
    left: "Beef heavy", right: "Fully plant-based",
  },
  {
    key: "carlessDays" as const,
    label: "Car-Free Days / Week",
    unit: (v: number) => `-${v} days`,
    min: 0, max: 7,
    left: "Drive always", right: "WFH / transit",
  },
  {
    key: "thermostatOffset" as const,
    label: "Thermostat Offset",
    unit: (v: number) => `-${v}°C`,
    min: 0, max: 5,
    left: "Standard AC", right: "Adaptive",
  },
  {
    key: "secondHandPercent" as const,
    label: "Circular Apparel",
    unit: (v: number) => `${v}% thrifted`,
    min: 0, max: 100,
    left: "Fast fashion", right: "100% upcycled",
  },
];

export function SimulatorPanel() {
  const { simulator, setSimulator, transactions, activeTab, setActiveTab } =
    useCarbonStore();

  const simStatus = calculateTwinStatus(transactions, simulator);

  return (
    <div
      className={`glass rounded-3xl p-6 border transition-all duration-300 ${
        activeTab === "simulator"
          ? "border-brand-500/30"
          : "border-surface-border"
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-200">
            What-If Simulator
          </h3>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            Instant lifestyle adjustments
          </p>
        </div>
        <span
          className="px-2 py-1 text-[10px] font-mono rounded-lg cursor-pointer
          bg-brand-500/10 text-brand-400 border border-brand-500/20
          hover:bg-brand-500/20 transition-colors"
          onClick={() => setActiveTab("simulator")}
        >
          Live Forecast
        </span>
      </div>

      <div className="space-y-5">
        {SLIDERS.map(({ key, label, unit, min, max, left, right }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-300 font-medium">{label}</span>
              <span className="font-mono font-bold text-brand-400">
                {unit(simulator[key])}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={simulator[key]}
              onChange={(e) =>
                setSimulator({ [key]: Number(e.target.value) })
              }
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-zinc-800 accent-brand-400"
              aria-label={label}
            />
            <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
              <span>{left}</span>
              <span>{right}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 p-3 glass rounded-xl border border-brand-500/15">
        <p className="text-xs text-center text-brand-400 italic">
          {simStatus.cedarsEquivalent > 0
            ? `🌲 These changes would spare ${simStatus.cedarsEquivalent} Siberian cedars' worth of sequestration per year.`
            : "⬆️ Adjust the sliders above to see your green impact potential."}
        </p>
      </div>
    </div>
  );
}
