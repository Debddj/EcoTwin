"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Leaf, Flame } from 'lucide-react';
import { TwinMoodState, TwinStatus } from '@/types';

interface TwinAvatarProps {
  status: TwinStatus;
}

export default function TwinAvatar({ status }: TwinAvatarProps) {
  const { state, score, trend, trendPercent } = status;

  // Render SVG elements depending on state
  const getStyleConfigs = (currentState: TwinMoodState) => {
    switch (currentState) {
      case 'sapling':
        return {
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900',
          textColor: 'text-emerald-700 dark:text-emerald-300',
          message: 'Vibrant & Sprouting',
          desc: 'A young sapling. Keep emissions minimal to let it grow into a thriving forest ecosystem!',
          baseColor: '#8B5A2B', // Healthy Soil Brown
          foliageColor: '#10B981', // Emerald
          glowColor: 'rgba(16, 185, 129, 0.4)'
        };
      case 'thriving':
        return {
          bgColor: 'bg-teal-50/50 dark:bg-teal-950/15 border-green-200 dark:border-teal-900',
          textColor: 'text-emerald-800 dark:text-teal-300',
          message: 'Lush & Thriving Forest',
          desc: 'Your emissions are well below baseline thresholds. A rich canopy sheltering carbon sinks!',
          baseColor: '#5C4033', // Deep forest brown
          foliageColor: '#059669', // Deep Emerald
          glowColor: 'rgba(5, 150, 105, 0.5)'
        };
      case 'wilting':
        return {
          bgColor: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900',
          textColor: 'text-amber-700 dark:text-amber-300',
          message: 'Wilting & Weakened',
          desc: 'Above optimal limits. Leaves are drying up and falling. Initiate simulation savings soon.',
          baseColor: '#6E6E6E', // Graying trunk
          foliageColor: '#D97706', // Yellowing Amber
          glowColor: 'rgba(217, 119, 6, 0.2)'
        };
      case 'drought':
        return {
          bgColor: 'bg-red-50/40 dark:bg-red-950/10 border-red-200 dark:border-red-900/50',
          textColor: 'text-red-700 dark:text-pink-300',
          message: 'Arid Drought Crisis',
          desc: 'Emissions are dangerously high. Ground has dried, leaves have scorched off. High carbon wear confirmed.',
          baseColor: '#4A3B32', // Dry cracked blackish wood
          foliageColor: '#B45309', // Dead brown
          glowColor: 'rgba(239, 68, 68, 0.1)'
        };
    }
  };

  const currentStyles = getStyleConfigs(state);

  return (
    <div className={`rounded-3xl p-6 border transition-all duration-700 backdrop-blur-sm ${currentStyles.bgColor} relative overflow-hidden`} id="twin-avatar-panel">
      {/* Dynamic Background Atmospheric Particles */}
      {state === 'thriving' && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            className="absolute rounded-full bg-emerald-400/20 blur-md w-24 h-24 -left-6 -top-6"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div 
            className="absolute rounded-full bg-teal-400/10 blur-xl w-32 h-32 right-10 bottom-2"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
        </div>
      )}
      {state === 'drought' && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div 
            className="absolute rounded-full bg-amber-500/10 blur-xl w-40 h-40 left-12 top-10"
            animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Flame spark particles floating up */}
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-amber-500 rounded-full"
              style={{ bottom: '15%', left: `${20 * i + 10}%` }}
              animate={{ y: [-10, -100], x: [0, Math.sin(i) * 20, 0], opacity: [0, 0.8, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
            />
          ))}
        </div>
      )}

      {/* Floating Leaves for Green States */}
      {(state === 'thriving' || state === 'sapling') && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute text-emerald-400/50"
              style={{ top: `${i * 25}%`, right: `${i * 20}%` }}
              animate={{ 
                y: [0, 10, 0],
                x: [0, -15, 0],
                rotate: [0, 20, -20, 0] 
              }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            >
              <Leaf size={14 + i * 2} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-start mb-6 z-10 relative">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400 dark:text-slate-500">Living Digital Twin</span>
          <h3 className="text-2xl font-sans font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2 mt-1">
            {state === 'sapling' && '🌱'}
            {state === 'thriving' && '🌳'}
            {state === 'wilting' && '🥀'}
            {state === 'drought' && '🏜️'}
            {currentStyles.message}
          </h3>
        </div>
        
        {/* Trend Indicator Panel */}
        <div className="text-right">
          <div className="text-xs font-mono text-slate-400 dark:text-slate-500">7d Trend</div>
          <div className="flex items-center gap-1.5 mt-1">
            {trend === 'improving' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                <Sparkles size={12} />
                +{trendPercent}% Clean
              </span>
            ) : trend === 'worsening' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                <AlertTriangle size={12} />
                +{trendPercent}% Carbon
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Stable
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Animated Vector Visual Stage */}
      <div className="h-64 flex items-center justify-center relative mb-6">
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full max-h-[240px]" 
          id="twin-svg-stage"
        >
          {/* Ground Stage Floor */}
          <path 
            d="M 20 170 Q 100 155 180 170" 
            fill="none" 
            stroke={state === 'drought' ? '#D97706' : state === 'wilting' ? '#8F7865' : '#8B5A2B'} 
            strokeWidth="6" 
            strokeLinecap="round" 
          />
          {state === 'drought' && (
            <>
              {/* Cracked Desert Sand lines */}
              <line x1="50" y1="170" x2="60" y2="185" stroke="#B45309" strokeWidth="2" />
              <line x1="60" y1="185" x2="55" y2="195" stroke="#B45309" strokeWidth="2" />
              <line x1="140" y1="170" x2="130" y2="182" stroke="#B45309" strokeWidth="2" />
              <line x1="130" y1="182" x2="138" y2="192" stroke="#B45309" strokeWidth="2" />
            </>
          )}

          {/* Core Organism Drawing */}
          {state === 'sapling' ? (
            <>
              {/* Young Soil Mound */}
              <path d="M 70 170 Q 100 145 130 170 Z" fill="#5C4033" />
              
              {/* Main Sprout Sprout Stem */}
              <motion.path 
                d="M 100 160 Q 95 120 110 90" 
                fill="none" 
                stroke="#10B981" 
                strokeWidth="5" 
                strokeLinecap="round"
                animate={{ d: ['M 100 160 Q 95 120 110 90', 'M 100 160 Q 98 120 108 90', 'M 100 160 Q 95 120 110 90'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Young Sprouts Leaves */}
              <motion.path 
                d="M 110 90 Q 125 80 128 92 Q 115 98 110 90 Z" 
                fill="#34D399" 
                animate={{ rotate: [0, 5, -5, 0] }}
                style={{ transformOrigin: "110px 90px" }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.path 
                d="M 103 115 Q 85 110 82 118 Q 98 123 103 115 Z" 
                fill="#059669" 
                animate={{ rotate: [0, -6, 6, 0] }}
                style={{ transformOrigin: "103px 115px" }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              />
            </>
          ) : state === 'thriving' ? (
            <>
              {/* Thriving Forest Canopy Backdrop & Tree Trunk */}
              <g id="trunk-and-leaves">
                {/* Branches */}
                <path d="M 100 170 L 100 115" stroke={currentStyles.baseColor} strokeWidth="10" strokeLinecap="round" />
                <path d="M 100 140 Q 80 125 70 120" fill="none" stroke={currentStyles.baseColor} strokeWidth="6" strokeLinecap="round" />
                <path d="M 100 130 Q 120 115 130 110" fill="none" stroke={currentStyles.baseColor} strokeWidth="6" strokeLinecap="round" />
                
                {/* Layered SVG forest canopy */}
                <circle cx="70" cy="110" r="28" fill="#047857" opacity="0.85" />
                <circle cx="130" cy="100" r="30" fill="#065F46" opacity="0.85" />
                <circle cx="100" cy="85" r="38" fill="#14532D" opacity="0.9" />

                {/* Breathing Top Highlights */}
                <motion.circle 
                  cx="100" cy="80" r="32" 
                  fill="#10B981" 
                  animate={{ scale: [1, 1.04, 1] }} 
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} 
                />
                <motion.circle 
                  cx="75" cy="105" r="22" 
                  fill="#34D399" 
                  animate={{ scale: [1, 1.03, 1] }} 
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} 
                />
                <motion.circle 
                  cx="125" cy="95" r="24" 
                  fill="#059669" 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} 
                />

                {/* Sparkling floral symbols */}
                <g opacity="0.9">
                  <circle cx="90" cy="70" r="2" fill="#FCD34D" />
                  <circle cx="115" cy="85" r="2" fill="#FCD34D" />
                  <circle cx="65" cy="100" r="1.5" fill="#FCD34D" />
                </g>
              </g>
            </>
          ) : state === 'wilting' ? (
            <>
              {/* Trunk and Bare Dying Limbs */}
              <path d="M 100 170 L 100 110" stroke={currentStyles.baseColor} strokeWidth="8" strokeLinecap="round" />
              <path d="M 100 135 Q 82 125 75 120" fill="none" stroke={currentStyles.baseColor} strokeWidth="5" strokeLinecap="round" />
              <path d="M 100 120 Q 118 112 125 105" fill="none" stroke={currentStyles.baseColor} strokeWidth="5" strokeLinecap="round" />
              
              {/* Sparsely scattered yellowing/orange leaf clusters */}
              <circle cx="70" cy="115" r="14" fill="#D97706" opacity="0.8" />
              <circle cx="120" cy="102" r="16" fill="#F59E0B" opacity="0.8" />
              <circle cx="95" cy="85" r="18" fill="#B45309" opacity="0.85" />

              {/* Falling wilting leaf */}
              <motion.path 
                d="M 85 110 Q 75 140 80 155" 
                fill="none" 
                stroke="#D97706" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
              />
              <motion.polygon 
                points="80,152 84,157 78,160 76,155" 
                fill="#B45309"
                animate={{ y: [0, 8, 0], rotate: [0, 20, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.polygon 
                points="115,120 119,125 113,128 111,123" 
                fill="#D97706"
                animate={{ y: [0, 25], x: [0, -10], opacity: [1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeIn' }}
              />
            </>
          ) : (
            <>
              {/* Drought - Bone Dry Gray Tree Trunk */}
              <path d="M 100 170 L 100 115" stroke={currentStyles.baseColor} strokeWidth="7" strokeLinecap="round" />
              
              {/* Split Ends */}
              <path d="M 100 115 Q 90 95 80 90" fill="none" stroke={currentStyles.baseColor} strokeWidth="4" strokeLinecap="round" />
              <path d="M 100 115 Q 110 95 122 88" fill="none" stroke={currentStyles.baseColor} strokeWidth="4" strokeLinecap="round" />
              
              {/* Dead side branch snaps */}
              <path d="M 100 142 L 80 138" fill="none" stroke={currentStyles.baseColor} strokeWidth="4" strokeLinecap="round" />
              <path d="M 100 130 L 115 125" fill="none" stroke={currentStyles.baseColor} strokeWidth="4" strokeLinecap="round" />

              {/* Solar Heat wave ripples */}
              <motion.path 
                d="M 30 70 Q 100 50 170 70" 
                fill="none" 
                stroke="rgba(239, 68, 68, 0.2)" 
                strokeWidth="3"
                animate={{ d: ['M 30 70 Q 100 50 170 70', 'M 30 65 Q 100 55 170 65', 'M 30 70 Q 100 50 170 70'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.path 
                d="M 50 45 Q 100 35 150 45" 
                fill="none" 
                stroke="rgba(245, 158, 11, 0.15)" 
                strokeWidth="2"
                animate={{ d: ['M 50 45 Q 100 35 150 45', 'M 50 40 Q 100 40 150 40', 'M 50 45 Q 100 35 150 45'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              />

              {/* Cracked Dirt mounds */}
              <path d="M 75 170 L 85 180 M 125 170 L 115 182" stroke="#78350F" strokeWidth="2" />
            </>
          )}
        </svg>

        {/* Dial badge */}
        <div className="absolute right-4 bottom-4 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center shadow-md">
          <div className="text-[10px] font-mono uppercase text-slate-400 dark:text-slate-500">Eco-Score</div>
          <div className="text-lg font-mono font-bold text-slate-800 dark:text-slate-100">{score}/100</div>
        </div>
      </div>

      {/* Description Explanation */}
      <div className="space-y-3 z-10 relative">
        <p className="text-sm font-sans text-slate-600 dark:text-slate-300">
          {currentStyles.desc}
        </p>
        
        {/* Vitality bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono text-slate-400 dark:text-slate-500">
            <span>Soil Vitality</span>
            <span>{score}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full rounded-full transition-all duration-700 ${
                state === 'thriving' ? 'bg-emerald-500' :
                state === 'sapling' ? 'bg-teal-400' :
                state === 'wilting' ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
        
        {/* Metric Display */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-white/50 dark:bg-slate-950/20 rounded-xl p-2 text-center border border-slate-200/50 dark:border-slate-800/50">
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Footprint average</div>
            <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200">
              <span className="font-sans">{status.carbonAverage.toFixed(1)}</span> kg/day
            </div>
          </div>
          <div className="bg-white/50 dark:bg-slate-950/20 rounded-xl p-2 text-center border border-slate-200/50 dark:border-slate-800/50">
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">Equivalent</div>
            <div className="text-sm font-semibold flex items-center justify-center gap-1 text-slate-700 dark:text-slate-200">
              {state === 'thriving' ? (
                <>
                  <Sparkles size={12} className="text-yellow-500" />
                  <span>Healthy Air</span>
                </>
              ) : state === 'sapling' ? (
                <>
                  <Leaf size={12} className="text-teal-400" />
                  <span>Clean Soil</span>
                </>
              ) : state === 'wilting' ? (
                <>
                  <AlertTriangle size={12} className="text-amber-500" />
                  <span>Heavy Load</span>
                </>
              ) : (
                <>
                  <Flame size={12} className="text-red-500" />
                  <span>Dry Burn</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
