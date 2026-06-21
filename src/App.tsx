/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  AlertTriangle,
  Leaf,
  Flame,
  Plus,
  Trash2,
  FileText,
  Upload,
  Send,
  RefreshCw,
  Camera,
  Layers,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  Sliders,
  MessageSquare,
  History,
  X,
  CreditCard,
  ShoppingBag,
  Info
} from 'lucide-react';

import { Transaction, TransactionCategory, TwinStatus, WhatIfState, CoachMessage } from './types';
import { EMISSION_FACTORS, DEMO_PRESETS, SAMPLE_CSV_CONTENT, SAMPLE_RECEIPT_PRESETS } from './data/mockData';
import TwinAvatar from './components/TwinAvatar';

// Standard baseline footprint calculations
const DAILY_EMISSION_BASELINE_KG = 13.5; // Typical baseline individual (approx 5 tons/year)

export default function App() {
  // Navigation sidebar tab state
  const [activeTab, setActiveTab] = useState<'ecosystem' | 'transactions' | 'simulator' | 'coach'>('ecosystem');

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    // Start with suburban commuter preset preloaded
    const defaultPreset = DEMO_PRESETS[1];
    return defaultPreset.transactions.map((t, idx) => ({
      ...t,
      id: `init-${idx}-${Date.now()}`,
      co2e: t.amount * EMISSION_FACTORS[t.category].kgCo2ePerDollar
    })) as Transaction[];
  });

  // Manual Ingest State
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState<TransactionCategory>('Groceries');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Receipts State
  const [pastedReceiptText, setPastedReceiptText] = useState('');
  const [selectedReceiptPreset, setSelectedReceiptPreset] = useState<number | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // File CSV Ingest State
  const [csvText, setCsvText] = useState('');
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  // What-If Simulator State
  const [simulator, setSimulator] = useState<WhatIfState>({
    meatReduction: 0,
    carlessDays: 0,
    thermostatOffset: 0,
    secondHandPercent: 0
  });

  // EcoCoach Conversation State
  const [chatMessages, setChatMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I am EcoCoach, your carbon intelligence advisor. Connect your ledger, slide the green parameters, or upload a store receipt below, and I'll analyze specific habits for carbon reductions.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  // General Notification / Success alerts
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // --------------------------------------------------------
  // Core Carbon calculations & Twin state transition engine
  // --------------------------------------------------------
  const calculateAggregateFootprint = (txList: Transaction[], simState: WhatIfState) => {
    let totalNormalCO2 = 0;
    let totalSimulatedCO2 = 0;

    txList.forEach((tx) => {
      const baseEmission = tx.co2e;
       totalNormalCO2 += baseEmission;

       // Apply real-time reductions based on what-if sliders
       let factor = 1.0;
       if (tx.category === 'Groceries') {
         // Swapping beef/red meat (high emissions density) for beans/poultry. Max 45% reduction of grocery footprint
         factor = 1.0 - (simState.meatReduction / 100) * 0.45;
       } else if (tx.category === 'Fuel') {
         // Days not driving standard cars. If 2 fewer days out of 7, reduce fuel footprint by 2/7
         factor = 1.0 - (simState.carlessDays / 7);
       } else if (tx.category === 'Utilities') {
         // Lowering thermostats by degrees. Approx 4% reduction per degree Celsius offset
         factor = 1.0 - (simState.thermostatOffset * 0.04);
       } else if (tx.category === 'Fast Fashion') {
         // Buying thrift/second-hand avoids 90% of raw textile fuel footprint
         factor = 1.0 - (simState.secondHandPercent / 100) * 0.90;
       }

       totalSimulatedCO2 += baseEmission * factor;
    });

    const activeCO2 = totalSimulatedCO2;
    const weeklyTotal = activeCO2;
    // Turn into average per day
    const dayCount = Math.max(1, Math.ceil(txList.length / 1.5)); // estimate duration density
    const calculatedDailyAverage = weeklyTotal / Math.max(1, dayCount);

    // Compute comparative Trend compared to basic regional baseline index
    const baselineDailyIndex = DAILY_EMISSION_BASELINE_KG;
    const percentageDifference = ((calculatedDailyAverage - baselineDailyIndex) / baselineDailyIndex) * 100;
    
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (percentageDifference < -5) {
      trend = 'improving';
    } else if (percentageDifference > 5) {
      trend = 'worsening';
    }

    // Map carbon output to score (0 to 100). Clearer score = higher value
    // 3.0 kgCO2/day or less = 100 points. 25.0 kgCO2e/day or more = 10 points
    let score = Math.round(100 - (calculatedDailyAverage * 3.5));
    score = Math.max(12, Math.min(100, score));

    // Resolve twin mood thresholds
    let state: 'sapling' | 'thriving' | 'wilting' | 'drought' = 'sapling';
    if (score >= 82) {
      state = 'thriving';
    } else if (score >= 55) {
      state = 'sapling';
    } else if (score >= 32) {
      state = 'wilting';
    } else {
      state = 'drought';
    }

    return {
      state,
      score,
      carbonAverage: calculatedDailyAverage,
      weeklyTotal,
      trend,
      trendPercent: Math.abs(Math.round(percentageDifference)),
      yearlyTonsEmitted: (calculatedDailyAverage * 365) / 1000,
      cedarsEquivalent: Math.max(0, Math.round(((DAILY_EMISSION_BASELINE_KG - calculatedDailyAverage) * 365) / 22)) // 1 tree sequesters roughly 22kg CO2 per year
    };
  };

  const currentStats = calculateAggregateFootprint(transactions, simulator);

  // --------------------------------------------------------
  // Preset Demo Seeder
  // --------------------------------------------------------
  const loadPreset = (preset: typeof DEMO_PRESETS[0]) => {
    const generated = preset.transactions.map((tx, i) => ({
      ...tx,
      id: `seed-${Date.now()}-${i}`,
      co2e: tx.amount * EMISSION_FACTORS[tx.category].kgCo2ePerDollar
    })) as Transaction[];
    
    setTransactions(generated);
    // Reset simulator values on preset shift to show authentic starting point
    setSimulator({
      meatReduction: 0,
      carlessDays: 0,
      thermostatOffset: 0,
      secondHandPercent: 0
    });
    showNotification(`Seeded ${preset.name} lifestyle template!`, 'info');
  };

  // --------------------------------------------------------
  // CSV Import Processor
  // --------------------------------------------------------
  const handleCSVImport = (rawText: string) => {
    if (!rawText.trim()) {
      showNotification('CSV body is empty. Please enter columns.', 'error');
      return;
    }

    try {
      const lines = rawText.trim().split('\n');
      const parsedTransactions: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by comma
        const parts = line.split(',');
        if (parts.length >= 3) {
          const date = parts[0]?.trim() || new Date().toISOString().split('T')[0];
          const merchant = parts[1]?.trim() || 'Unlisted Store';
          const amount = parseFloat(parts[2]?.trim() || '0');
          let category = (parts[3]?.trim() || 'Eco Goods') as TransactionCategory;

          // Normalize category
          if (!EMISSION_FACTORS[category]) {
            category = 'Eco Goods';
          }

          if (!isNaN(amount) && amount > 0) {
            parsedTransactions.push({
              id: `csv-${Date.now()}-${i}`,
              date,
              merchant,
              amount,
              category,
              co2e: amount * EMISSION_FACTORS[category].kgCo2ePerDollar,
              source: 'upload',
              confidence: 0.9
            });
          }
        }
      }

      if (parsedTransactions.length === 0) {
        showNotification('No valid transaction rows found in CSV. Format: Date,Merchant,Amount,Category', 'error');
        return;
      }

      setTransactions((prev) => [...parsedTransactions, ...prev]);
      setCsvText('');
      showNotification(`Successfully parsed & imported ${parsedTransactions.length} transactions via statement!`, 'success');
    } catch (e: any) {
      showNotification('Failed to read statement. Ensure columns align.', 'error');
    }
  };

  // Load a specified pre-baked text receipt
  const loadReceiptPreset = (index: number) => {
    setSelectedReceiptPreset(index);
    setPastedReceiptText(SAMPLE_RECEIPT_PRESETS[index].text);
  };

  // --------------------------------------------------------
  // Receipt OCR Text classification (Gemini API Call)
  // --------------------------------------------------------
  const processReceiptOCR = async () => {
    if (!pastedReceiptText.trim()) {
      setOcrError('Please enter receipt text or choose one of the quick presets below first.');
      return;
    }

    setOcrLoading(true);
    setOcrError(null);

    try {
      const response = await fetch('/api/classify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptText: pastedReceiptText })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'The server returned an unsuccessful response classification.');
      }

      const extracted = data.result;
      const cat = (extracted.category || 'Eco Goods') as TransactionCategory;
      const amount = Number(extracted.amount || 25);
      
      const newTx: Transaction = {
        id: `ocr-${Date.now()}`,
        date: extracted.date || new Date().toISOString().split('T')[0],
        merchant: extracted.merchant || 'Extracted Merchant',
        amount: amount,
        category: cat,
        co2e: amount * EMISSION_FACTORS[cat].kgCo2ePerDollar,
        source: 'ocr',
        confidence: Number(extracted.confidence || 0.95)
      };

      setTransactions((prev) => [newTx, ...prev]);
      setPastedReceiptText('');
      setSelectedReceiptPreset(null);
      showNotification(`Ingested $${amount.toFixed(2)} at ${extracted.merchant}! Classified as ${cat} (${Math.round(newTx.co2e)} kg CO2e)`, 'success');
      
      // Auto switch target to ecosystem to see the updated twin
      setActiveTab('ecosystem');
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || 'Gemini transaction extraction failed. Verify your secret variables setting.');
    } finally {
      setOcrLoading(false);
    }
  };

  // --------------------------------------------------------
  // Manual Ingestion Row Addition
  // --------------------------------------------------------
  const addManualTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (!manualMerchant || isNaN(amt) || amt <= 0) {
      showNotification('Verify merchant name and spent numeric amount.', 'error');
      return;
    }

    const calculatedCo2 = amt * EMISSION_FACTORS[manualCategory].kgCo2ePerDollar;
    const newTx: Transaction = {
      id: `manual-${Date.now()}`,
      date: manualDate,
      merchant: manualMerchant,
      amount: amt,
      category: manualCategory,
      co2e: calculatedCo2,
      source: 'manual',
      confidence: 1.0
    };

    setTransactions((prev) => [newTx, ...prev]);
    setManualMerchant('');
    setManualAmount('');
    showNotification(`Logged $${amt.toFixed(2)} to ${manualCategory}!`, 'success');
  };

  // --------------------------------------------------------
  // Delete Row
  // --------------------------------------------------------
  const removeTx = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showNotification('Removed transaction row.', 'info');
  };

  // Clear Ledger completely
  const clearLedger = () => {
    if (window.confirm('Are you sure you want to wipe current dataset? Your digital twin will reset.')) {
      setTransactions([]);
      showNotification('Wiped accounts transactions.', 'info');
    }
  };

  // --------------------------------------------------------
  // EcoCoach Assistant AI Client Interaction (Gemini API Call)
  // --------------------------------------------------------
  const sendCoachPrompt = async (forcedPrompt?: string) => {
    const textToSend = forcedPrompt || chatInput;
    if (!textToSend.trim()) return;

    // Append user bubble
    const userMessage: CoachMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    if (!forcedPrompt) setChatInput('');

    setCoachLoading(true);
    setCoachError(null);

    // If active tab is not coach, auto switch to show user feedback
    if (activeTab !== 'coach') {
      setActiveTab('coach');
    }

    try {
      const response = await fetch('/api/ecocoach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          transactionHistory: transactions
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Server error speaking to advisor agency.');
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setCoachError(err.message || 'EcoCoach fails to respond. Ensure your GEMINI_API_KEY is configured.');
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] text-[#E0E0E0] font-sans overflow-hidden" id="ecotwin-app">
      
      {/* 1. LEFT NAVIGATION RAIL */}
      <nav className="w-20 bg-[#0A0A0A] border-r border-white/10 flex flex-col items-center py-6 justify-between shrink-0" id="nav-rail">
        <div className="flex flex-col items-center space-y-8">
          {/* Logo Badge */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#2D5A27] to-[#86EFAC] flex items-center justify-center text-black font-extrabold tracking-tight text-sm shadow-lg shadow-green-950/20" title="EcoTwin Platform">
            ET
          </div>
          
          {/* Nav Item Buttons */}
          <div className="flex flex-col space-y-4 pt-4">
            <button
              onClick={() => setActiveTab('ecosystem')}
              className={`p-3 rounded-xl transition-all duration-300 relative group ${
                activeTab === 'ecosystem' ? 'bg-white/10 text-[#86EFAC]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Twin Ecosystem"
            >
              <Layers size={20} />
              {activeTab === 'ecosystem' && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#86EFAC] rounded-r-md" />
              )}
              <span className="absolute left-24 bg-slate-900 border border-white/10 text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Ecosystem
              </span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`p-3 rounded-xl transition-all duration-300 relative group ${
                activeTab === 'transactions' ? 'bg-white/10 text-[#86EFAC]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Accounts & Ledger Uploads"
            >
              <FileText size={20} />
              {activeTab === 'transactions' && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#86EFAC] rounded-r-md" />
              )}
              <span className="absolute left-24 bg-slate-900 border border-white/10 text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                Ledger Ingest
              </span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`p-3 rounded-xl transition-all duration-300 relative group ${
                activeTab === 'simulator' ? 'bg-white/10 text-[#86EFAC]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="What-If Simulators"
            >
              <Sliders size={20} />
              {activeTab === 'simulator' && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#86EFAC] rounded-r-md" />
              )}
              <span className="absolute left-24 bg-slate-900 border border-white/10 text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                What-If Simulator
              </span>
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className={`p-3 rounded-xl transition-all duration-300 relative group ${
                activeTab === 'coach' ? 'bg-white/10 text-[#86EFAC]' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="EcoCoach Conversation Advice"
            >
              <MessageSquare size={20} />
              {activeTab === 'coach' && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#86EFAC] rounded-r-md" />
              )}
              <span className="absolute left-24 bg-slate-900 border border-white/10 text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                EcoCoach AI
              </span>
            </button>
          </div>
        </div>

        {/* Footprint Indicator Quick Ring */}
        <div className="mb-2 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-center text-xs text-slate-400 font-mono" title="Carbon Average rating">
            {currentStats.score}
          </div>
          <span className="text-[9px] font-mono mt-1 text-slate-500 uppercase tracking-tighter">Vitality</span>
        </div>
      </nav>

      {/* MAIN DYNAMIC CONTENT SCREEN */}
      <main className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto relative" id="main-canvas">
        
        {/* TOP STATUS ALERTS */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`absolute top-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl border shadow-xl z-50 flex items-center gap-3 backdrop-blur-md ${
                notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' :
                notification.type === 'error' ? 'bg-rose-950/80 border-rose-500/30 text-rose-300' :
                'bg-slate-900/90 border-slate-700 text-slate-200'
              }`}
            >
              {notification.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
              {notification.type === 'error' && <AlertTriangle size={16} className="text-rose-400 shrink-0" />}
              <span className="text-xs font-medium font-sans">{notification.message}</span>
              <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white ml-2 text-xs">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN HEADER PANEL */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" id="application-header">
          <div>
            <h1 className="text-4xl font-light tracking-tight font-serif italic text-[#E0E0E0]">
              EcoTwin
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-[#86EFAC] font-semibold mt-1">
              Living Data Ecosystem • Zero-Friction Carbon Estimator
            </p>
          </div>

          {/* Quick statement uploader action pill */}
          <div className="flex flex-wrap items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] uppercase opacity-40 leading-tight">Current Dataset</p>
              <p className="text-xs font-mono text-[#86EFAC]">{transactions.length} Transactions Ingested</p>
            </div>
            <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('transactions')}
                className="text-[11px] font-mono uppercase tracking-widest text-[#86EFAC] hover:text-[#a0f7c2] transition-colors flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-lg"
              >
                <Upload size={10} /> + Ingest Log
              </button>
            </div>
          </div>
        </header>

        {/* DEMO PRESET ROW */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
             <Layers size={14} className="text-slate-400" />
             <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Judge / Presenter Demo Seeder Presets</h3>
             <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded ml-auto">Frictionless Testing</span>
          </div>
          <p className="text-xs text-slate-400 mb-3 font-sans">
            Instantly shift modes without typing text or uploading files to test tree reactions and real spend carbon coefficients:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DEMO_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => loadPreset(preset)}
                className={`text-left p-3 rounded-xl border bg-gradient-to-br transition-all duration-300 ${preset.color}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold font-sans">{preset.name}</span>
                  <span className="text-[10px] font-mono font-semibold opacity-90">{preset.badge}</span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed font-sans block truncate" title={preset.description}>
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* TAB WORKSPACE GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-stretch">
          
          {/* CENTER LAYER: TWIN GRAPHICS (7 COLUMNS) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* The Living Twin Organism View */}
            <TwinAvatar status={currentStats} />

            {/* Quick-Insight Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-2xl">
                 <p className="text-[10px] uppercase opacity-40 font-mono tracking-widest mb-1">Est. Yearly Carbon Footprint</p>
                 <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-light font-serif tracking-tight text-white">{currentStats.yearlyTonsEmitted.toFixed(2)}</span>
                   <span className="text-xs text-slate-400 font-mono">Tons CO₂e/yr</span>
                 </div>
                 <p className="text-[11px] text-slate-500 mt-2 italic font-sans">
                   US Average is approx 14 tons/year. Target for climate stability is under 2.0 tons.
                 </p>
              </div>

              <div className="p-4 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-2xl flex flex-col justify-between">
                 <div>
                   <p className="text-[10px] uppercase opacity-40 font-mono tracking-widest mb-1">Impact Mitigation Equivalent</p>
                   {currentStats.cedarsEquivalent > 0 ? (
                     <div className="flex items-baseline gap-2 text-[#86EFAC]">
                       <span className="text-4xl font-light font-serif tracking-tight">{currentStats.cedarsEquivalent}</span>
                       <span className="text-xs text-[#86EFAC]/70 font-mono">Siberian Cedars/yr</span>
                     </div>
                   ) : (
                     <div className="text-amber-500 font-medium text-xs mt-1 flex items-center gap-1">
                       <AlertTriangle size={14} />
                       <span>Footprint is currently over standard. Zero trees saved.</span>
                     </div>
                   )}
                 </div>
                 <p className="text-[11px] text-slate-500 mt-2 italic block">
                   Sequestration translates pure carbon offsets into biological targets.
                 </p>
              </div>
            </div>

            {/* Recent Ledger Panel */}
            <div className="bg-black/30 border border-white/5 p-4 rounded-2xl">
               <div className="flex justify-between items-center mb-3">
                 <span className="text-xs uppercase tracking-widest font-mono text-slate-400">Dynamic Ingest Feed</span>
                 <button onClick={() => setActiveTab('transactions')} className="text-[11px] text-[#86EFAC] hover:underline flex items-center gap-1">
                   Manage ledger ({transactions.length}) ✕
                 </button>
               </div>
               
               <div className="space-y-2 max-h-[160px] overflow-y-auto">
                 {transactions.length === 0 ? (
                   <p className="text-xs italic text-slate-500 text-center py-4">No logged spend in ledger. Seed a preset or load statements to begin.</p>
                 ) : (
                   transactions.slice(0, 3).map((t) => (
                     <div key={t.id} className="bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors hover:bg-white/[0.03]">
                       <div className="flex items-center gap-3">
                         <span className="font-mono text-[10px] text-slate-500">{t.date}</span>
                         <div>
                           <p className="font-semibold text-slate-300">{t.merchant}</p>
                           <p className="text-[9px] text-[#86EFAC] font-mono">{t.category} (${t.amount.toFixed(2)})</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                         <span className={`font-mono text-xs font-semibold ${t.co2e > 50 ? 'text-red-400' : t.co2e > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                           +{t.co2e.toFixed(1)} kgCO₂
                         </span>
                         {t.confidence < 1 && t.confidence > 0 && (
                           <span className="text-[9px] px-1 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900" title={`AI Categorized Confidence: ${Math.round(t.confidence * 100)}%`}>
                             AI
                           </span>
                         )}
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>
          </div>

          {/* RIGHT COLUMNS: CONTROLS & SUB-WIDGET ACTIVATIONS (5 COLUMNS) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* COMPONENT 1: REAL-TIME WHAT-IF SIMULATOR */}
            <div className={`p-6 bg-gradient-to-b from-white/[0.02] to-transparent border rounded-3xl flex flex-col justify-between transition-all duration-300 ${activeTab === 'simulator' ? 'border-[#86EFAC]/30 shadow-lg shadow-green-950/10' : 'border-white/10'}`}>
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                     <Sliders size={14} className="text-[#86EFAC]" />
                     What-If Simulator
                   </h3>
                   <p className="text-[10px] opacity-50 mt-1">Simulate instant lifestyle adjustments</p>
                 </div>
                 <span className="px-2 py-1 bg-[#86EFAC]/10 text-[#86EFAC] text-[10px] rounded font-mono">Live Forecast</span>
              </div>

              <div className="space-y-5">
                {/* Meat Reduction Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Cut Red Meat Usage</span>
                    <span className="text-[#86EFAC] font-mono font-bold">-{simulator.meatReduction}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulator.meatReduction}
                    onChange={(e) => setSimulator(prev => ({ ...prev, meatReduction: Number(e.target.value) }))}
                    className="w-full h-1 bg-white/10 accent-[#86EFAC] appearance-none rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Beef & Pork heavy</span>
                    <span>Fully Plant-Based Swaps</span>
                  </div>
                </div>

                {/* Carless commute days Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Fewer Weekly Car Commutes</span>
                    <span className="text-[#86EFAC] font-mono font-bold">-{simulator.carlessDays} Days/Wk</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="7"
                    value={simulator.carlessDays}
                    onChange={(e) => setSimulator(prev => ({ ...prev, carlessDays: Number(e.target.value) }))}
                    className="w-full h-1 bg-white/10 accent-[#86EFAC] appearance-none rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Drive Always</span>
                    <span>Mass Transit / WFH Always</span>
                  </div>
                </div>

                {/* Thermostat adjustment Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Thermostat Offset (Cooling/Heating)</span>
                    <span className="text-[#86EFAC] font-mono font-bold">-{simulator.thermostatOffset}°C</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={simulator.thermostatOffset}
                    onChange={(e) => setSimulator(prev => ({ ...prev, thermostatOffset: Number(e.target.value) }))}
                    className="w-full h-1 bg-white/10 accent-[#86EFAC] appearance-none rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Standard grid AC</span>
                    <span>Adaptive thermal offset</span>
                  </div>
                </div>

                {/* Second Hand Thrifting Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Circular Apparel & Second Hand</span>
                    <span className="text-[#86EFAC] font-mono font-bold">{simulator.secondHandPercent}% Thrifted</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={simulator.secondHandPercent}
                    onChange={(e) => setSimulator(prev => ({ ...prev, secondHandPercent: Number(e.target.value) }))}
                    className="w-full h-1 bg-white/10 accent-[#86EFAC] appearance-none rounded-full cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Always fast-fashion brand</span>
                    <span>100% Upcycled garments</span>
                  </div>
                </div>
              </div>
              
              {/* Simulator bottom feedback note */}
              <div className="mt-6 p-3 border border-[#86EFAC]/20 bg-[#86EFAC]/5 rounded-xl">
                 <p className="text-center text-xs italic text-[#86EFAC] font-sans">
                   {currentStats.cedarsEquivalent > 0 ? (
                     `“These actions with your active transactions list will save raw emissions equivalent to letting ${currentStats.cedarsEquivalent} Siberian Cedars safely sequester carbon!”`
                   ) : (
                     "“Slide green thresholds above, and EcoTwin will dynamically calculate equivalent organic targets instantly!”"
                   )}
                 </p>
              </div>
            </div>

            {/* TAB-DEPENDENT WORKSPACE WIDGETS (RECEIPT OCR / LEDGER LIST / ECOCOACH CHAT) */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* TABS SELECTORS */}
              <div className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('transactions')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all ${
                    activeTab === 'transactions' ? 'bg-[#86EFAC] text-black font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  OCR & statements
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('coach')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all ${
                    activeTab === 'coach' ? 'bg-[#86EFAC] text-black font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  EcoCoach AI
                </button>
              </div>

              {/* VIEW 1: TRANSACTIONS / INGESTION (CSV & RECEIPT TEXT OCR) */}
              {activeTab === 'transactions' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div>
                    <h4 className="text-xs uppercase font-mono tracking-widest text-[#86EFAC] font-bold">Multimodal Gemini OCR Ingest</h4>
                    <p className="text-[11px] text-slate-400 mt-1">OCR & classify store purchases. No manual logging.</p>
                  </div>

                  {/* Receipt quick-select presets */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Quick receipt mock transcript presets:</p>
                    <div className="flex flex-col gap-1.5">
                      {SAMPLE_RECEIPT_PRESETS.map((rp, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => loadReceiptPreset(i)}
                          className={`text-slate-300 bg-white/5 hover:bg-white/10 border text-left px-2.5 py-1.5 rounded-lg text-[11px] font-sans flex items-center justify-between transition-colors ${
                            selectedReceiptPreset === i ? 'border-[#86EFAC] bg-[#86EFAC]/15 text-[#86EFAC]' : 'border-white/5'
                          }`}
                        >
                          <span className="font-semibold">{rp.emoji} {rp.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">Transcribe</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pasted text Area */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-mono uppercase">Store receipt text / Image transcription</label>
                    <textarea
                      placeholder="Paste receipt text or modify thermal mock above..."
                      value={pastedReceiptText}
                      onChange={(e) => setPastedReceiptText(e.target.value)}
                      className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs font-mono focus:border-[#86EFAC] focus:outline-none"
                    />
                  </div>

                  {ocrError && <p className="text-xs text-red-400 font-sans italic">{ocrError}</p>}

                  <button
                    onClick={processReceiptOCR}
                    disabled={ocrLoading}
                    className="w-full bg-[#86EFAC]/10 hover:bg-[#86EFAC]/20 text-[#86EFAC] font-mono text-xs font-bold uppercase tracking-wider py-2.5 border border-[#86EFAC]/30 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    {ocrLoading ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        Gemini Extracting & Categorizing...
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        Submit Receipt to Gemini
                      </>
                    )}
                  </button>

                  <div className="border-t border-white/5 my-4 pt-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase font-mono tracking-widest text-slate-400">Statement CSV Import</span>
                      <button 
                        onClick={() => setShowCsvHelp(!showCsvHelp)}
                        className="text-[10px] text-slate-500 hover:text-slate-300"
                      >
                        Help?
                      </button>
                    </div>

                    {showCsvHelp && (
                      <div className="bg-slate-900/50 p-2 text-[10px] leading-relaxed text-slate-400 rounded-lg border border-white/5">
                        <strong className="text-slate-300">Format:</strong> Date,Merchant,Amount,Category<br />
                        <strong className="text-slate-300">Supported rules:</strong> Fuel, Flights, Groceries, Fast Fashion, Utilities, Public Transit, Restaurants & Services, Eco Goods
                      </div>
                    )}

                    <div className="flex gap-2">
                      <textarea
                        placeholder="Date,Merchant,Amount,Category&#10;2026-06-18,Gas Chevron station,54.50,Fuel&#10;2026-06-19,Patagonia repair,25.00,Eco Goods"
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2 text-[10px] font-mono h-20 focus:border-[#86EFAC] focus:outline-none"
                      />
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCsvText(SAMPLE_CSV_CONTENT)}
                          className="bg-white/5 hover:bg-white/10 text-white border border-white/5 px-2 py-1 text-[10px] rounded"
                        >
                          Load Sample
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCSVImport(csvText)}
                          className="bg-[#86EFAC] hover:bg-[#86EFAC]/90 text-black font-bold px-2.5 py-1 text-[10px] rounded flex-1"
                        >
                          Import
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manual entry fallback drawer */}
                  <form onSubmit={addManualTx} className="border-t border-white/5 pt-4 space-y-3">
                    <span className="text-xs uppercase font-mono tracking-widest text-slate-400 block">Single Manual Log entry</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Merchant</label>
                        <input
                          type="text"
                          placeholder="e.g. Costco Gas"
                          value={manualMerchant}
                          onChange={(e) => setManualMerchant(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Spent Amount ($)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="42.50"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Category Factor</label>
                        <select
                          value={manualCategory}
                          onChange={(e) => setManualCategory(e.target.value as TransactionCategory)}
                          className="w-full bg-black border border-white/10 rounded-lg p-1.5 text-xs text-white"
                        >
                          {Object.keys(EMISSION_FACTORS).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase block mb-1">Transaction date</label>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-lg p-1.5 text-xs text-slate-300"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-mono text-[11px] font-bold uppercase tracking-wider py-1.5 rounded-lg border border-white/10 flex items-center justify-center gap-1"
                    >
                      <Plus size={12} /> Add to statement ledgers
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 2: ECOCOACH AI CONVERSANT CONSULTANT */}
              {activeTab === 'coach' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between h-[520px]">
                  
                  {/* Coach panel header */}
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                    <div className="w-9 h-9 rounded-full bg-[#86EFAC]/20 border border-[#86EFAC]/35 flex items-center justify-center text-lg">
                      💬
                    </div>
                    <div>
                      <h4 className="text-xs uppercase font-mono tracking-widest text-[#86EFAC] font-bold">EcoCoach AI Intelligence</h4>
                      <p className="text-[10px] text-slate-400">Personal carbon financial strategist</p>
                    </div>
                    
                    <button 
                      onClick={() => setChatMessages([{
                        id: 'welcome',
                        role: 'assistant',
                        content: 'Reset conversation. Send a message to initiate EcoCoach advisors!',
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }])}
                      className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto"
                      title="Clear chat context"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Messages Bubble Space */}
                  <div className="flex-1 overflow-y-auto my-3 space-y-3 pr-1 text-xs">
                    {chatMessages.map((m) => (
                      <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-gradient-to-tr from-[#2D5A27] to-[#124b13] text-white rounded-br-none'
                            : 'bg-white/5 border border-white/15 text-slate-100 rounded-bl-none'
                        }`}>
                          <p>{m.content}</p>
                          <span className="text-[8px] font-mono opacity-40 text-right block mt-1 tracking-widest">
                            {m.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}

                    {coachLoading && (
                      <div className="flex items-center gap-2 text-slate-400 italic text-[11px] py-2">
                        <RefreshCw className="animate-spin text-[#86EFAC]" size={12} />
                        <span>EcoCoach is parsing transaction coefficients...</span>
                      </div>
                    )}

                    {coachError && (
                      <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-rose-300">
                        <p>{coachError}</p>
                        <button 
                          onClick={() => sendCoachPrompt()} 
                          className="mt-2 text-xs font-bold underline block text-[#86EFAC]"
                        >
                          Retry Connection
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Prompts Rows */}
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <p className="text-[10px] text-slate-500 font-mono uppercase">Quick prompts aligned to active spending:</p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => sendCoachPrompt("Look at my travel emissions and give me Region swaps")}
                        className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-mono border border-white/15"
                      >
                        ✈️ Flights advice
                      </button>
                      <button
                        onClick={() => sendCoachPrompt("Compare my Gas usage to clean offsets")}
                        className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-mono border border-white/15"
                      >
                        ⛽ Fuel optimization
                      </button>
                      <button
                        onClick={() => sendCoachPrompt("What specific actions of mine can plant the most trees?")}
                        className="text-[10px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-mono border border-white/15"
                      >
                        🌳 Maximize Cedars
                      </button>
                    </div>

                    {/* Chat Form Element */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Inquire with EcoCoach concerning transactions..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendCoachPrompt()}
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-[#86EFAC] focus:outline-none"
                      />
                      <button
                        onClick={() => sendCoachPrompt()}
                        disabled={coachLoading || !chatInput.trim()}
                        className="p-2 rounded-xl bg-[#86EFAC] text-black hover:bg-[#a0f7c2] transition-all disabled:opacity-50 disabled:hover:bg-[#86EFAC]"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* FULL DIALOG TRANSACTIONS LEDGER DRAWER */}
        <section className="bg-black/40 border border-white/5 rounded-3xl p-6 mt-8">
           <div className="flex justify-between items-center mb-4">
             <div>
               <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-1.5">
                 <History size={15} className="text-[#86EFAC]" />
                 Account statement Ledger History
               </h3>
               <p className="text-[11px] opacity-50 font-sans mt-0.5">Edit, review or audit active carbon values assigned to spending dollars</p>
             </div>
             
             <button
               onClick={clearLedger}
               disabled={transactions.length === 0}
               className="text-xs bg-red-950/20 text-red-400 hover:bg-red-950/50 hover:text-red-300 border border-red-900/30 px-3 py-1.5 rounded-xl transition-all"
               title="Reset database simulator"
             >
               Wipe Ledger
             </button>
           </div>

           <div className="overflow-x-auto">
             <table className="w-full text-left text-xs divide-y divide-white/5">
                <thead>
                  <tr className="text-slate-500 font-mono text-[10px] uppercase">
                    <th className="py-3 px-4">Ingest ID</th>
                    <th className="py-3 px-4">Transaction Date</th>
                    <th className="py-3 px-4">Merchant Name</th>
                    <th className="py-3 px-4">Dollar Spend</th>
                    <th className="py-3 px-4">Spend Category</th>
                    <th className="py-3 px-4">Calculated CO₂e Score</th>
                    <th className="py-3 px-4 text-right">Ledger actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500">
                        {tx.source === 'ocr' ? '📷 Gemini OCR' : tx.source === 'upload' ? '📁 CSV Upload' : tx.source === 'seed' ? '🚀 Seed Preset' : '✍️ Manual'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">{tx.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-100">{tx.merchant}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">${tx.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-slate-900/60 dark:text-slate-350 border-slate-700/50">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        <span className={`font-mono ${tx.co2e > 70 ? 'text-red-400' : tx.co2e > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {tx.co2e.toFixed(1)} kgCO₂e
                        </span>
                        <span className="text-[10px] opacity-40 ml-1">
                          ({EMISSION_FACTORS[tx.category].kgCo2ePerDollar} / dollar)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => removeTx(tx.id)}
                          className="p-1 px-2.5 text-[11px] bg-white/5 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 rounded-lg max-h-7 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={11} className="inline mr-1" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
             {transactions.length === 0 && (
               <div className="p-8 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-2xl my-4">
                 <p className="text-sm text-slate-400 italic">Financial ledger database is currently empty.</p>
                 <p className="text-xs text-slate-500 mt-1">Select a Judge simulator preset above or upload thermal invoices to begin modeling.</p>
               </div>
             )}
           </div>
        </section>

        {/* ECOCOACH SCIENTIFIC METHODOLOGY APPENDIX */}
        <footer className="mt-12 text-center text-[11px] text-slate-500/80 font-sans tracking-wide space-y-2 border-t border-white/5 pt-6">
          <p>
            Methodology modeled directly from fintech standards and regional environmental carbon coefficients.
          </p>
          <p>
            Spend factors mapped: Flights (1.25 kgCO2e/$), Fuel (0.82 kgCO2e/$), Utilities (0.65 kgCO2e/$), Fast Fashion (0.45 kgCO2e/$), Groceries (0.22 kgCO2e/$).
          </p>
          <p>
            © 2026 EcoTwin Inc. Integrated with Google Gemini model intelligence.
          </p>
        </footer>

      </main>
    </div>
  );
}
