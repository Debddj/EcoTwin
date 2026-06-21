"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Leaf,
  Plus,
  Trash2,
  FileText,
  Upload,
  Send,
  RefreshCw,
  Camera,
  Sliders,
  MessageSquare,
  History,
  Database
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { toast, Toaster } from 'sonner';

import { TransactionCategory } from '@/types';
import { EMISSION_FACTORS, DEMO_PRESETS, SAMPLE_CSV, RECEIPT_PRESETS } from '@/lib/constants/emission-factors';
import { calculateTwinStatus } from '@/lib/utils/carbon';
import TwinAvatar from '@/components/TwinAvatar';
import { useEcoStore } from '@/store/useEcoStore';

export default function Home() {
  const {
    activeTab,
    setActiveTab,
    transactions,
    addTransaction,
    removeTransaction,
    clearLedger,
    loadPreset,
    importCSV,
    simulator,
    setSimulator,
    chatMessages,
    addChatMessage,
    chatInput,
    setChatInput,
    ocrLoading,
    setOcrLoading,
    ocrError,
    setOcrError,
    coachLoading,
    setCoachLoading,
    coachError,
    setCoachError,
    initializeStore
  } = useEcoStore();

  // Manual Ingest State
  const [manualMerchant, setManualMerchant] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState<TransactionCategory>('Groceries');
  const [manualDate, setManualDate] = useState('');

  // Receipts Paste State
  const [pastedReceiptText, setPastedReceiptText] = useState('');
  const [selectedReceiptPreset, setSelectedReceiptPreset] = useState<number | null>(null);

  // CSV Import box State
  const [csvText, setCsvText] = useState('');
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  // Chat window element reference
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Set today's date for manual date inputs on mount
  useEffect(() => {
    setManualDate(new Date().toISOString().split('T')[0] || '');
  }, []);

  // Initialize store cache
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle preset loading
  const handleLoadPreset = (preset: typeof DEMO_PRESETS[0]) => {
    loadPreset(preset);
    toast.success(`Seeded "${preset.name}" profile!`);
  };

  // Handle manual item submission
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualAmount);
    if (!manualMerchant.trim() || isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid merchant and positive amount.');
      return;
    }

    addTransaction({
      date: manualDate || (new Date().toISOString().split('T')[0] as string),
      merchant: manualMerchant.trim(),
      amount: amt,
      category: manualCategory,
      source: 'manual',
      confidence: 1.0
    });

    setManualMerchant('');
    setManualAmount('');
    toast.success(`Logged $${amt.toFixed(2)} spent at ${manualMerchant}.`);
  };

  // Handle CSV Import submission
  const handleCSVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = importCSV(csvText);
    if (res.success) {
      toast.success(`Successfully imported ${res.count} transactions!`);
      setCsvText('');
    } else {
      toast.error(res.error || 'CSV import failed.');
    }
  };

  // Handle Receipt OCR submission
  const handleReceiptOCR = async () => {
    if (!pastedReceiptText.trim()) {
      setOcrError('Please enter receipt text or choose one of the quick presets.');
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
        throw new Error(data.error || 'Gemini OCR failed to extract transaction details.');
      }

      const extracted = data.result;
      const cat = (extracted.category || 'Eco Goods') as TransactionCategory;
      const amount = Number(extracted.amount || 15);
      
      addTransaction({
        date: extracted.date || new Date().toISOString().split('T')[0],
        merchant: extracted.merchant || 'Extracted Store',
        amount: amount,
        category: cat,
        source: 'ocr',
        confidence: Number(extracted.confidence || 0.95)
      });

      setPastedReceiptText('');
      setSelectedReceiptPreset(null);
      toast.success(`OCR Extracted $${amount.toFixed(2)} at ${extracted.merchant}! Classified as ${cat}.`);
      setActiveTab('ecosystem');
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setOcrError(errMsg || 'Gemini transaction extraction failed.');
      toast.error('Failed to analyze receipt. Check key config.');
    } finally {
      setOcrLoading(false);
    }
  };

  // Handle Chat advice prompts
  const handleSendChat = async (forcedPrompt?: string) => {
    const promptText = forcedPrompt || chatInput;
    if (!promptText.trim()) return;

    addChatMessage({
      role: 'user',
      content: promptText
    });

    if (!forcedPrompt) setChatInput('');
    setCoachLoading(true);
    setCoachError(null);

    if (activeTab !== 'coach') {
      setActiveTab('coach');
    }

    // Capture state values inside function context
    const currentMessages = [
      ...chatMessages,
      { role: 'user', content: promptText }
    ];

    try {
      const response = await fetch('/api/ecocoach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
          transactionHistory: transactions.map(tx => ({
            merchant: tx.merchant,
            amount: tx.amount,
            category: tx.category,
            co2e: tx.co2e
          }))
        })
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get feedback from EcoCoach.');
      }

      addChatMessage({
        role: 'assistant',
        content: data.answer
      });
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setCoachError(errMsg || 'EcoCoach fails to respond.');
      toast.error('EcoCoach is temporarily offline. Check key configuration.');
    } finally {
      setCoachLoading(false);
    }
  };

  const handleReceiptPresetClick = (idx: number) => {
    setSelectedReceiptPreset(idx);
    const preset = RECEIPT_PRESETS[idx];
    if (preset) {
      setPastedReceiptText(preset.text);
    }
  };

  // Aggregate Calculations using centralized utility
  const status = calculateTwinStatus(transactions, simulator);

  // Recharts Chart calculation
  const getCategoryChartData = () => {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach((tx) => {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.co2e;
    });

    return Object.entries(categoryTotals).map(([name, value]) => {
      let color = '#6B7280';
      const factor = EMISSION_FACTORS[name as TransactionCategory];
      if (factor) {
        if (factor.color.includes('emerald')) color = '#10B981';
        else if (factor.color.includes('amber')) color = '#F59E0B';
        else if (factor.color.includes('red')) color = '#EF4444';
        else if (factor.color.includes('purple')) color = '#8B5CF6';
        else if (factor.color.includes('blue')) color = '#3B82F6';
        else if (factor.color.includes('cyan')) color = '#06B6D4';
        else if (factor.color.includes('orange')) color = '#F97316';
        else if (factor.color.includes('teal')) color = '#14B8A6';
      }
      return {
        name,
        value: Math.round(value),
        color
      };
    }).filter(item => item.value > 0);
  };

  const categoryChartData = getCategoryChartData();

  return (
    <div className="flex h-screen w-full bg-[#050505] text-[#E0E0E0] font-sans overflow-hidden" id="ecotwin-app">
      <Toaster position="top-right" theme="dark" closeButton />
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#0a0a0c] border-r border-white/5 flex flex-col justify-between p-6 z-10 shrink-0">
        <div className="space-y-8">
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-900 to-brand-400 flex items-center justify-center text-black font-extrabold text-lg shadow-md shadow-brand-950/20">
              ET
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold text-white tracking-tight leading-none">EcoTwin</h1>
              <span className="text-[10px] font-mono text-brand-400 tracking-widest uppercase">Carbon Sandbox</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {([
              { id: 'ecosystem', label: 'Twin Ecosystem', icon: Leaf },
              { id: 'transactions', label: 'Ledger Logs', icon: History },
              { id: 'simulator', label: 'What-If Engine', icon: Sliders },
              { id: 'coach', label: 'EcoCoach chat', icon: MessageSquare }
            ] as const).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-mono font-bold tracking-wide uppercase transition-all duration-200 border ${
                    active 
                      ? 'bg-brand-500/10 border-brand-500/20 text-brand-400' 
                      : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Offline Badge footer */}
        <div className="space-y-3 border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <Database size={12} className="text-brand-500 animate-pulse" />
            <span>Storage Mode:</span>
            <span className="text-brand-400 uppercase font-bold">Local Fallback</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
            Transactions stored locally. No cloud sync active. All calculations run offline in real-time.
          </p>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Glow flares in background */}
        <div className="absolute rounded-full bg-brand-900/10 blur-3xl w-96 h-96 -right-24 -top-24 pointer-events-none" />
        <div className="absolute rounded-full bg-[#1e1b4b]/15 blur-3xl w-[480px] h-[480px] left-10 bottom-10 pointer-events-none" />

        {/* Tab view screen body */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          <AnimatePresence mode="wait">
            
            {/* ECOSYSTEM TAB */}
            {activeTab === 'ecosystem' && (
              <motion.div
                key="ecosystem"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-serif text-slate-100 font-bold tracking-tight">Your Digital Twin</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                    EcoTwin represents your current carbon emissions trend as a living SVG tree. Adjust your spending ledger or simulate lifestyle shifts to watch it heal or wilt.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Column: Visual Twin Tree */}
                  <div className="lg:col-span-2 space-y-4">
                    <TwinAvatar status={status} />
                  </div>

                  {/* Right Column: Recharts share and seed controls */}
                  <div className="lg:col-span-3 space-y-6">
                    {/* Share breakdown block */}
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col h-[280px]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Carbon Breakdown</span>
                          <h4 className="text-lg font-bold text-slate-200 mt-0.5">Emissions by Category</h4>
                        </div>
                        {transactions.length > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                            {transactions.length} items
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-h-0 flex items-center justify-center">
                        {transactions.length === 0 ? (
                          <div className="text-center text-xs font-mono text-slate-500 py-10">
                            No ledger logs loaded. Seed preset below.
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {categoryChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '12px' }}
                                itemStyle={{ color: '#e4e4e7', fontFamily: 'monospace', fontSize: '11px' }}
                              />
                              <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Preload Lifestyle presets selectors */}
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 space-y-4">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Ledger Seed Engine</span>
                        <h4 className="text-lg font-bold text-slate-200 mt-0.5">Preload Demo Lifestyle Profiles</h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                          Reset the transaction workspace instantly with standard lifestyle averages to evaluate simulated shifts.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {DEMO_PRESETS.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => handleLoadPreset(preset)}
                            className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl p-4 text-left transition-all duration-300 flex flex-col justify-between space-y-3 group"
                          >
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300">
                                {preset.badge}
                              </span>
                              <h5 className="text-xs font-bold text-slate-200 mt-2 tracking-tight group-hover:text-brand-400 transition-colors">
                                {preset.name}
                              </h5>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed mt-2">
                              {preset.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TRANSACTIONS LEDGER TAB */}
            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-serif text-slate-100 font-bold tracking-tight">Ledger Workspace</h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                      Log expenditures manually, import CSV lists, or upload receipts using server-side Gemini OCR.
                    </p>
                  </div>
                  {transactions.length > 0 && (
                    <button
                      onClick={clearLedger}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200"
                    >
                      Wipe ledger dataset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Column: Log manual, import CSV, OCR receipts */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Gemini Multimodal Receipt OCR box */}
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Camera size={18} className="text-brand-400" />
                        <h4 className="text-sm font-bold text-slate-200">Gemini Receipt OCR Classification</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Input a raw OCR text log from a store purchase below. Gemini extracts store brand, date, spent cash, and maps it to a carbon index.
                      </p>

                      <div className="space-y-3">
                        <textarea
                          placeholder="Paste thermal text here... (or click preset tags below)"
                          value={pastedReceiptText}
                          onChange={(e) => setPastedReceiptText(e.target.value)}
                          className="w-full bg-black/60 border border-white/5 rounded-2xl px-4 py-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono h-24"
                        />

                        {ocrError && (
                          <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-[10px]">
                            {ocrError}
                          </div>
                        )}

                        {/* Presets */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">Load Receipt Presets:</span>
                          <div className="flex flex-wrap gap-2">
                            {RECEIPT_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleReceiptPresetClick(idx)}
                                className={`text-[10px] px-2.5 py-1.5 rounded-xl border transition-all ${
                                  selectedReceiptPreset === idx
                                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-400 font-bold'
                                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04]'
                                }`}
                              >
                                {preset.emoji} {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleReceiptOCR}
                          disabled={ocrLoading || !pastedReceiptText.trim()}
                          className="w-full bg-brand-500 hover:bg-brand-400 text-black font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                          {ocrLoading ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Analyzing OCR Text...
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              Extract with Gemini
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Manual entry log form */}
                    <form onSubmit={handleAddManual} className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Plus size={18} className="text-brand-400" />
                        <h4 className="text-sm font-bold text-slate-200">Manual Expenditure Logger</h4>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Merchant Name</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Shell, H&M"
                              value={manualMerchant}
                              onChange={(e) => setManualMerchant(e.target.value)}
                              className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Cash Spent ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              placeholder="0.00"
                              value={manualAmount}
                              onChange={(e) => setManualAmount(e.target.value)}
                              className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Category</label>
                            <select
                              value={manualCategory}
                              onChange={(e) => setManualCategory(e.target.value as TransactionCategory)}
                              className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs focus:border-brand-500 focus:outline-none text-slate-200"
                            >
                              {Object.keys(EMISSION_FACTORS).map((cat) => (
                                <option key={cat} value={cat} className="bg-[#0c0c0e]">
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              required
                              value={manualDate}
                              onChange={(e) => setManualDate(e.target.value)}
                              className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs focus:border-brand-500 focus:outline-none text-slate-200"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-white/5 hover:bg-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Plus size={14} /> Log Transaction
                        </button>
                      </div>
                    </form>

                    {/* CSV Statement Input Area */}
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Upload size={16} className="text-brand-400" />
                          <h4 className="text-sm font-bold text-slate-200">CSV statement log batch</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCsvHelp(!showCsvHelp)}
                          className="text-[10px] font-mono text-slate-400 hover:text-white underline"
                        >
                          {showCsvHelp ? 'Hide columns' : 'Show columns'}
                        </button>
                      </div>

                      <AnimatePresence>
                        {showCsvHelp && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/60 border border-white/5 p-3 rounded-xl text-[10px] font-mono text-slate-400 space-y-2 overflow-hidden"
                          >
                            <div>Expected Headers:</div>
                            <div className="text-brand-400">Date,Merchant,Amount,Category,Source</div>
                            <div>Example row:</div>
                            <div>2026-06-18,Chevron Gas Station,54.50,Fuel,CSV</div>
                            <button
                              type="button"
                              onClick={() => setCsvText(SAMPLE_CSV)}
                              className="text-[10px] text-brand-400 hover:text-brand-300 underline font-bold mt-1 block"
                            >
                              Load demo CSV statement text
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <form onSubmit={handleCSVSubmit} className="space-y-3">
                        <textarea
                          placeholder="Date,Merchant,Amount,Category,Source..."
                          value={csvText}
                          onChange={(e) => setCsvText(e.target.value)}
                          className="w-full bg-black/60 border border-white/5 rounded-2xl px-4 py-3 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono h-20"
                        />

                        <button
                          type="submit"
                          disabled={!csvText.trim()}
                          className="w-full bg-white/5 hover:bg-white/10 text-white font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl border border-white/10 transition-all disabled:opacity-40"
                        >
                          Ingest CSV statement
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Ledger table items */}
                  <div className="lg:col-span-3">
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 space-y-4 h-full flex flex-col max-h-[85vh]">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Expenditure History</span>
                          <h4 className="text-lg font-bold text-slate-200 mt-0.5">Transactions Ledger</h4>
                        </div>
                        {transactions.length > 0 && (
                          <span className="text-xs font-mono text-brand-400">
                            {transactions.length} rows loaded
                          </span>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto border border-white/5 rounded-2xl bg-black/20">
                        {transactions.length === 0 ? (
                          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
                            <FileText size={32} className="text-slate-600 animate-pulse" />
                            <div className="text-xs font-mono text-slate-500">Your ledger workspace is clean.</div>
                            <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                              Log manual receipts on the left, paste log statements, or seeding a preset on the Digital Twin tab.
                            </p>
                          </div>
                        ) : (
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] font-mono text-slate-400 uppercase">
                                <th className="p-3.5 pl-4">Date</th>
                                <th className="p-3.5">Store / Brand</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5 text-right">Spent</th>
                                <th className="p-3.5 text-right">CO2e</th>
                                <th className="p-3.5 text-center">Src</th>
                                <th className="p-3.5 pr-4 text-center">Wipe</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map((tx) => {
                                const factor = EMISSION_FACTORS[tx.category];
                                return (
                                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                                    <td className="p-3.5 pl-4 font-mono text-slate-400 whitespace-nowrap">{tx.date}</td>
                                    <td className="p-3.5 font-semibold text-slate-200 whitespace-nowrap overflow-hidden max-w-[120px] text-ellipsis">{tx.merchant}</td>
                                    <td className="p-3.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] border whitespace-nowrap font-mono ${
                                        factor?.color || 'bg-white/5 border-white/10 text-white'
                                      }`}>
                                        {tx.category}
                                      </span>
                                    </td>
                                    <td className="p-3.5 text-right font-mono text-slate-300">${tx.amount.toFixed(2)}</td>
                                    <td className="p-3.5 text-right font-mono text-brand-400 font-bold whitespace-nowrap">
                                      {Math.round(tx.co2e)} <span className="text-[9px] font-normal text-slate-500">kg</span>
                                    </td>
                                    <td className="p-3.5 text-center">
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest ${
                                        tx.source === 'ocr' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                        tx.source === 'manual' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                        tx.source === 'upload' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                      }`}>
                                        {tx.source}
                                      </span>
                                    </td>
                                    <td className="p-3.5 pr-4 text-center">
                                      <button
                                        onClick={() => removeTransaction(tx.id)}
                                        className="text-slate-500 hover:text-red-400 transition-colors"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* WHAT-IF SIMULATOR TAB */}
            {activeTab === 'simulator' && (
              <motion.div
                key="simulator"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-3xl font-serif text-slate-100 font-bold tracking-tight">What-If Simulation Sandbox</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                    Slide environmental variables to model structural lifestyle improvements. Recompute aggregate metrics instantly to measure impact on your digital twin.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Left Column: Interactive sliders */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-slate-200">Adjust Green Action Sliders</h4>
                        <button
                          onClick={() => setSimulator({ meatReduction: 0, carlessDays: 0, thermostatOffset: 0, secondHandPercent: 0 })}
                          className="text-[10px] font-mono text-slate-400 hover:text-brand-400 underline uppercase"
                        >
                          Reset Sliders
                        </button>
                      </div>

                      {/* Slider 1: Red Meat Reduction */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">Red Meat Reduction</span>
                          <span className="font-mono text-brand-400 font-bold">{simulator.meatReduction}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simulator.meatReduction}
                          onChange={(e) => setSimulator({ meatReduction: parseInt(e.target.value) })}
                          className="w-full accent-brand-500 cursor-pointer h-1.5 rounded-lg bg-white/10"
                        />
                        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                          Reduces Grocery emissions. Cattle farming generates high methane volumes per calorie.
                        </p>
                      </div>

                      {/* Slider 2: Carless Days */}
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">Carless Transit Days (Fewer Drive Days)</span>
                          <span className="font-mono text-brand-400 font-bold">{simulator.carlessDays} days/wk</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="7"
                          value={simulator.carlessDays}
                          onChange={(e) => setSimulator({ carlessDays: parseInt(e.target.value) })}
                          className="w-full accent-brand-500 cursor-pointer h-1.5 rounded-lg bg-white/10"
                        />
                        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                          Cuts Fuel logs directly. Replaced by bus, train, or biking.
                        </p>
                      </div>

                      {/* Slider 3: Thermostat Degree Offset */}
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">Thermostat Adjustment (Winter/Summer)</span>
                          <span className="font-mono text-brand-400 font-bold">{simulator.thermostatOffset} °F offset</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          value={simulator.thermostatOffset}
                          onChange={(e) => setSimulator({ thermostatOffset: parseInt(e.target.value) })}
                          className="w-full accent-brand-500 cursor-pointer h-1.5 rounded-lg bg-white/10"
                        />
                        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                          Lowers home Utilities emissions. Saves ~4% grid heating/cooling energy per degree.
                        </p>
                      </div>

                      {/* Slider 4: Fast Fashion second hand */}
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">Synthetic Fashion Replaced by Second-Hand</span>
                          <span className="font-mono text-brand-400 font-bold">{simulator.secondHandPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simulator.secondHandPercent}
                          onChange={(e) => setSimulator({ secondHandPercent: parseInt(e.target.value) })}
                          className="w-full accent-brand-500 cursor-pointer h-1.5 rounded-lg bg-white/10"
                        />
                        <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                          Reduces apparel carbon. Synthetic polyester fabrics consume direct fossil resources.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Simulated footprint stats */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 space-y-6 flex flex-col justify-between h-full">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Projection Dashboard</span>
                        <h4 className="text-lg font-bold text-slate-200 mt-0.5">Calculated Simulated Impact</h4>
                      </div>

                      {/* Score Metrics */}
                      <div className="space-y-4 py-4">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Projected Daily Average</div>
                          <div className="text-3xl font-mono font-bold text-slate-200 mt-2">
                            {status.carbonAverage.toFixed(2)} <span className="text-xs text-slate-400 font-normal">kgCO2e / day</span>
                          </div>
                          <div className="text-[10px] font-mono text-brand-400 mt-1 flex items-center justify-center gap-1">
                            <Sparkles size={11} /> Baseline is 13.5 kg/day
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Yearly Total</div>
                            <div className="text-xl font-mono font-bold text-slate-200 mt-1">
                              {status.yearlyTonsEmitted.toFixed(2)} <span className="text-xs font-normal text-slate-500">tons</span>
                            </div>
                          </div>

                          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Trees Saved Equivalent</div>
                            <div className="text-xl font-mono font-bold text-brand-400 mt-1">
                              {status.cedarsEquivalent} <span className="text-xs font-normal text-slate-500">seedlings</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-2xl space-y-2">
                        <div className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wide flex items-center gap-1.5">
                          <MessageSquare size={13} /> Ask EcoCoach
                        </div>
                        <p className="text-[11px] text-brand-300 leading-relaxed">
                          Do you want actionable advice to realize these reductions? Tap below to open coach chat with these variables.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSendChat("Summarize my simulated green action plan!")}
                          className="bg-brand-500 hover:bg-brand-400 text-black font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all"
                        >
                          Review with Advisor
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ECOCOACH CHAT ADVISOR TAB */}
            {activeTab === 'coach' && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-[82vh] space-y-6"
              >
                <div>
                  <h2 className="text-3xl font-serif text-slate-100 font-bold tracking-tight">EcoCoach Chat</h2>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl">
                    Conversational advice based on your current transaction registry and What-If settings. Powered by Gemini.
                  </p>
                </div>

                <div className="flex-1 bg-[#0a0a0c] border border-white/5 rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
                  
                  {/* Chat message scrolling stream */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar">
                    {chatMessages.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[80%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isUser 
                              ? 'bg-brand-500 text-black shadow-md' 
                              : 'bg-white/5 border border-white/10 text-brand-400'
                          }`}>
                            {isUser ? 'U' : 'EC'}
                          </div>

                          <div className={`p-4 rounded-3xl text-xs leading-relaxed space-y-1 ${
                            isUser 
                              ? 'bg-brand-500/10 border border-brand-500/20 text-slate-200 rounded-tr-none' 
                              : 'bg-white/[0.02] border border-white/5 text-slate-300 rounded-tl-none'
                          }`}>
                            <div className="whitespace-pre-line">{msg.content}</div>
                            <span className="text-[9px] font-mono text-slate-500 block text-right mt-2">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {coachLoading && (
                      <div className="flex gap-3 max-w-[80%] mr-auto">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-brand-400 flex items-center justify-center font-bold text-xs animate-pulse">
                          EC
                        </div>
                        <div className="p-4 rounded-3xl rounded-tl-none bg-white/[0.02] border border-white/5 text-slate-400 text-xs flex items-center gap-2">
                          <RefreshCw size={12} className="animate-spin" />
                          <span>EcoCoach is analyzing your carbon footprint...</span>
                        </div>
                      </div>
                    )}

                    {coachError && (
                      <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-400 text-xs text-left max-w-md">
                        ⚠️ {coachError}
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion prompt tags */}
                  {chatMessages.length === 1 && (
                    <div className="space-y-1.5 pb-4">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">Suggested Prompts:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "What is my biggest carbon sink?",
                          "How do I cut down on my gasoline footprint?",
                          "Explain spend-based factors."
                        ].map((prompt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSendChat(prompt)}
                            className="bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-slate-400 hover:text-slate-200 text-xs px-3.5 py-2 rounded-2xl transition-all"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat footer text box inputs */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask EcoCoach environmental recommendations..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                      className="flex-1 bg-black/60 border border-white/5 rounded-2xl px-4 py-3 text-xs focus:border-brand-500 focus:outline-none text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendChat()}
                      disabled={coachLoading || !chatInput.trim()}
                      className="bg-brand-500 hover:bg-brand-400 text-black font-bold py-3 px-6 rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      <Send size={14} /> Send
                    </button>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
