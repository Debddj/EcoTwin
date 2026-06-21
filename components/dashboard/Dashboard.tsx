"use client";

import { useEffect } from "react";
import { useCarbonStore } from "@/store/carbon-store";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TwinAvatar } from "@/components/dashboard/TwinAvatar";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
import { SimulatorPanel } from "@/components/dashboard/SimulatorPanel";
import { TransactionTable } from "@/components/ledger/TransactionTable";
import { ReceiptOCR } from "@/components/ledger/ReceiptOCR";
import { EcoCoach } from "@/components/coach/EcoCoach";
import { PresetSelector } from "@/components/ui/PresetSelector";
import { calculateTwinStatus } from "@/lib/utils/carbon";

export function Dashboard() {
  const { transactions, simulator, loadTransactions, activeTab } =
    useCarbonStore();

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const twinStatus = calculateTwinStatus(transactions, simulator);

  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      <Sidebar twinScore={twinStatus.score} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header transactionCount={transactions.length} />

        <div className="flex-1 p-6 md:p-8 space-y-8">
          {/* Preset seeder */}
          <PresetSelector />

          {/* Main grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Left: Twin + Stats */}
            <div className="xl:col-span-7 space-y-6">
              <TwinAvatar status={twinStatus} />
              <StatsGrid status={twinStatus} />
              <CategoryBreakdown transactions={transactions} />
            </div>

            {/* Right: Controls */}
            <div className="xl:col-span-5 space-y-6">
              <SimulatorPanel />

              {/* Tab content */}
              {activeTab === "ledger" || activeTab === "ecosystem" ? (
                <ReceiptOCR />
              ) : (
                <EcoCoach transactions={transactions} />
              )}
            </div>
          </div>

          {/* Full-width ledger */}
          <TransactionTable transactions={transactions} />
        </div>
      </main>
    </div>
  );
}
