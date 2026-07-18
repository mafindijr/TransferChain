"use client";

import React from "react";
import ConnectButton from "./connectButton";

export default function Header() {
  return (
    <>
      {/* 1. Header Top Info Bar (Specer style: Clean Dark) */}
      <div className="bg-[#111111] border-b border-[#dd1515]/20 text-[11px] py-3 text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="text-[#dd1515] font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#dd1515]" />
              PROTOCOL OPERATIONAL
            </span>
            <span className="hidden md:inline">
              NETWORK: <strong className="text-zinc-200">INJECTIVE EVM MAINNET</strong>
            </span>
            <span className="hidden md:inline">
              GAS: <strong className="text-zinc-200">12 GWEI</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#contracts" className="hover:text-white transition-colors">Smart Contracts</a>
            <span className="text-zinc-700">|</span>
            <a href="#console" className="hover:text-white transition-colors">dApp Console</a>
          </div>
        </div>
      </div>

      {/* 2. Main Header / Nav (Specer Theme: Glassmorphic Translucent Navbar) */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md text-zinc-950 border-b border-zinc-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-20">
          
          {/* Logo & Protocol Title */}
          <div className="flex items-center gap-3">
            <div className="bg-[#dd1515] w-12 h-12 flex items-center justify-center text-white font-black text-2xl tracking-tighter">
              TC
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-zinc-950">
                TRANSFER<span className="text-[#dd1515]">CHAIN</span>
              </span>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black -mt-1">
                ON-CHAIN FOOTBALL REGISTRY & ESCROW
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 font-extrabold text-xs uppercase tracking-wider text-zinc-900">
            <a href="#hero" className="border-b-2 border-[#dd1515] text-[#dd1515] pb-1 hover:text-[#dd1515] transition-all">HOME</a>
            <a href="#live-agreements" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">AGREEMENTS</a>
            <a href="#players" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">PLAYER FEED</a>
            <a href="#activity" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">LEDGER</a>
            <a href="#console" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">CONSOLE</a>
          </nav>

          {/* Wallet Actions */}
          <div className="flex items-center gap-3">
            <ConnectButton />
          </div>
        </div>
      </header>
    </>
  );
}
