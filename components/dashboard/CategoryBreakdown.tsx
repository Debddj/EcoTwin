"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { EMISSION_FACTORS } from "@/lib/constants/emission-factors";
import type { Transaction, TransactionCategory } from "@/types";

interface Props {
  transactions: Transaction[];
}

export function CategoryBreakdown({ transactions }: Props) {
  const data = Object.entries(
    transactions.reduce<Record<string, number>>((acc, tx) => {
      acc[tx.category] = (acc[tx.category] ?? 0) + tx.co2e;
      return acc;
    }, {})
  )
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: EMISSION_FACTORS[name as TransactionCategory]?.hexColor ?? "#6B7280",
    }));

  return (
    <div className="glass rounded-2xl p-5">
      <h3 className="text-xs uppercase font-mono tracking-widest text-zinc-500 mb-4">
        CO₂ Share by Category
      </h3>

      {data.length === 0 ? (
        <p className="text-sm text-zinc-600 italic text-center py-8">
          Add transactions to generate the breakdown chart.
        </p>
      ) : (
        <div className="grid grid-cols-12 items-center gap-4">
          <div className="col-span-5 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={58}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} kgCO₂e`, "Emissions"]}
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="col-span-7 space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {data
              .sort((a, b) => b.value - a.value)
              .map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-zinc-400">{item.name}</span>
                  </div>
                  <span className="font-semibold text-zinc-300">
                    {item.value} kg
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
