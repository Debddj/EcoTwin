"use client";

import { useRef, useEffect, useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { v4 as uuid } from "uuid";
import { useCarbonStore } from "@/store/carbon-store";
import type { Transaction, CoachMessage } from "@/types";

interface Props {
  transactions: Transaction[];
}

const QUICK_PROMPTS = [
  { label: "✈️ Flight emissions", prompt: "Analyze my travel emissions and suggest swaps." },
  { label: "⛽ Fuel optimization", prompt: "Compare my fuel spending to clean transit alternatives." },
  { label: "🌳 Maximize impact", prompt: "Which single action of mine can save the most carbon?" },
  { label: "👕 Fashion footprint", prompt: "Break down my fashion spending's carbon impact." },
];

export function EcoCoach({ transactions }: Props) {
  const {
    chatMessages,
    isCoachLoading,
    coachError,
    addChatMessage,
    setCoachLoading,
    setCoachError,
    clearChat,
  } = useCarbonStore();

  const [input, setInput] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingContent]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isCoachLoading) return;

    const userMsg: CoachMessage = {
      id: uuid(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    addChatMessage(userMsg);
    setInput("");
    setCoachLoading(true);
    setCoachError(null);
    setStreamingContent("");

    const allMessages = [...chatMessages, userMsg];

    try {
      const res = await fetch("/api/ecocoach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          transactionHistory: transactions.map((tx) => ({
            merchant: tx.merchant,
            amount: tx.amount,
            category: tx.category,
            co2e: tx.co2e,
          })),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      if (!res.body) throw new Error("No response stream.");

      // Stream the response word by word
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamingContent(accumulated);
      }

      // Commit to store
      addChatMessage({
        id: uuid(),
        role: "assistant",
        content: accumulated,
        timestamp: Date.now(),
      });
      setStreamingContent("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "EcoCoach failed.";
      setCoachError(msg);
    } finally {
      setCoachLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-surface-border">
        <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm">
          🌿
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-400">
            EcoCoach AI
          </h4>
          <p className="text-[10px] text-zinc-600">
            Streaming · Gemini 1.5 Flash
          </p>
        </div>
        <button
          onClick={clearChat}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-mono"
        >
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-900/60 border border-brand-500/20 text-zinc-200 rounded-br-sm"
                  : "bg-white/[0.03] border border-surface-border text-zinc-300 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <span className="block text-[9px] font-mono opacity-30 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[88%] px-3 py-2 rounded-2xl rounded-bl-sm text-xs leading-relaxed bg-white/[0.03] border border-surface-border text-zinc-300">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-1.5 h-3 bg-brand-400 animate-pulse ml-0.5 -mb-0.5" />
            </div>
          </div>
        )}

        {isCoachLoading && !streamingContent && (
          <div className="flex items-center gap-2 text-zinc-600 text-xs">
            <RefreshCw className="animate-spin text-brand-400" size={12} />
            Analyzing your spending...
          </div>
        )}

        {coachError && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 text-xs">
            {coachError}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts + input */}
      <div className="p-4 border-t border-surface-border space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(({ label, prompt }) => (
            <button
              key={label}
              onClick={() => sendMessage(prompt)}
              disabled={isCoachLoading}
              className="text-[10px] px-2 py-1 glass border border-surface-border rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors font-mono disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask EcoCoach about your spending..."
            disabled={isCoachLoading}
            className="flex-1 bg-black/40 border border-surface-border rounded-xl px-3 py-2
              text-xs text-zinc-300 placeholder-zinc-700
              focus:border-brand-500/50 focus:outline-none
              disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isCoachLoading || !input.trim()}
            className="p-2.5 rounded-xl bg-brand-500 text-black hover:bg-brand-400 transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
