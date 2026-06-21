"use client";

import type { Transaction } from "@/types";

interface Props {
  transactions: Transaction[];
}

export function EcoCoach({ transactions }: Props) {
  return (
    <div className="p-4 border border-surface-border bg-surface-elevated rounded-2xl text-xs text-zinc-500">
      EcoCoach Stub ({transactions.length} items)
    </div>
  );
}
