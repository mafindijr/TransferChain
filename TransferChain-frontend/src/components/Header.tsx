"use client";

import React, { useState } from "react";
import ConnectButton from "./connectButton";
import Link from "next/link";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* 1. Header Top Info Bar */}
      <div className="bg-[#111111] border-b border-[#dd1515]/20 text-[11px] py-2.5 text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-[#dd1515] font-bold flex items-center gap-1.5 animate-pulse text-[10px] sm:text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#dd1515]" />
              PROTOCOL OPERATIONAL
            </span>
            <span className="hidden md:inline">
              NETWORK: <strong className="text-zinc-200">INJECTIVE EVM (CHAIN 1439)</strong>
            </span>
            <span className="hidden lg:inline">
              GAS: <strong className="text-zinc-200">12 GWEI</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] sm:text-[11px]">
            <Link href="/#injective-stack" className="hover:text-white transition-colors">Injective Stack</Link>
            <span className="text-zinc-700">|</span>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          </div>
        </div>
      </div>

      {/* 2. Main Header / Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-zinc-950 border-b border-zinc-200/80 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-20">
          
          {/* Logo & Protocol Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-[#dd1515] w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-tighter shadow-md group-hover:bg-zinc-950 transition-colors">
              TC
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-zinc-950">
                TRANSFER<span className="text-[#dd1515]">CHAIN</span>
              </span>
              <p className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-black -mt-1">
                INJECTIVE SPORTS ESCROW
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10 font-extrabold text-xs uppercase tracking-wider text-zinc-900">
            <Link href="/" className="border-b-2 border-transparent pb-1 ms-2 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">HOME</Link>
            <Link href="/marketplace" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">MARKETPLACE</Link>
            <Link href="/clubs" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">CLUBS</Link>
            <Link href="/register-player" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">REGISTER PLAYER</Link>
            <Link href="/clubs/register" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">REGISTER CLUB</Link>
          </nav>

          {/* Right Actions: Connect Wallet + Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <ConnectButton />
            
            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md border border-zinc-300 text-zinc-800 hover:text-[#dd1515] hover:border-[#dd1515] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 3. Mobile / Medium Screen Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-zinc-950 text-white border-b border-zinc-800 px-6 py-6 space-y-4 animate-slide-down shadow-2xl">
            <nav className="flex flex-col space-y-3 font-extrabold text-sm uppercase tracking-wider">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-800/80 hover:text-[#dd1515] transition-colors flex justify-between items-center"
              >
                <span>HOME</span>
                <span className="text-zinc-600 text-xs">→</span>
              </Link>
              <Link
                href="/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-800/80 hover:text-[#dd1515] transition-colors flex justify-between items-center"
              >
                <span>MARKETPLACE</span>
                <span className="text-zinc-600 text-xs">→</span>
              </Link>
              <Link
                href="/clubs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-800/80 hover:text-[#dd1515] transition-colors flex justify-between items-center"
              >
                <span>CLUBS</span>
                <span className="text-zinc-600 text-xs">→</span>
              </Link>
              <Link
                href="/#injective-stack"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-800/80 hover:text-[#dd1515] transition-colors flex justify-between items-center"
              >
                <span>INJECTIVE STACK</span>
                <span className="text-cyan-400 text-xs">⚡</span>
              </Link>
              <Link
                href="/register-player"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 border-b border-zinc-800/80 hover:text-[#dd1515] transition-colors flex justify-between items-center"
              >
                <span>REGISTER PLAYER</span>
                <span className="text-zinc-600 text-xs">→</span>
              </Link>
              <Link
                href="/clubs/register"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 hover:text-[#dd1515] transition-colors flex justify-between items-center"
              >
                <span>REGISTER CLUB</span>
                <span className="text-zinc-600 text-xs">→</span>
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
