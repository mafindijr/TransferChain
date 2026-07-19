"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="relative bg-[#111111] text-zinc-400 py-16 border-t border-zinc-900 bg-cover bg-center"
      style={{
        backgroundImage: "linear-gradient(to top, rgba(17,17,17,0.99), rgba(17,17,17,0.92)), url('/img/footer-bg.jpg')",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Equal 4-Column Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Subsection 1: Brand & Overview */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-white uppercase block">
                TRANSFER<span className="text-[#dd1515]">CHAIN</span>
              </span>
              <p className="text-xs leading-relaxed text-zinc-400">
                Institutional-grade settlement registry and sports transfer escrow powered by Injective EVM smart contracts.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 bg-[#dd1515]/10 text-[#dd1515] text-[10px] font-mono font-bold px-3 py-1.5 rounded border border-[#dd1515]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#dd1515] animate-pulse" />
                INJECTIVE EVM 
              </span>
            </div>
          </div>

          {/* Subsection 2: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b-2 border-[#dd1515] pb-2 inline-block">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><Link href="/" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> Home</Link></li>
              <li><Link href="/marketplace" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> Marketplace</Link></li>
              <li><Link href="/clubs" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> Verified Clubs</Link></li>
              <li><Link href="/register-player" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> Register Player</Link></li>
            </ul>
          </div>

          {/* Subsection 3: Protocol Specs & Docs */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b-2 border-[#dd1515] pb-2 inline-block">
              Documentation
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><Link href="/#injective-stack" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> x/402 Micropayments</Link></li>
              <li><Link href="/#injective-stack" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> Circle CCTP Bridge</Link></li>
              <li><Link href="/#injective-stack" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> MCP Agent Server API</Link></li>
              <li><Link href="/#injective-stack" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> Agent Skills Engine</Link></li>
              <li><Link href="/#activity" className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5"><span>›</span> World Cup Audit Logs</Link></li>
            </ul>
          </div>

          {/* Subsection 4: Protocol Newsletter */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b-2 border-[#dd1515] pb-2 inline-block">
              Protocol Updates
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Subscribe for real-time notifications on active transfer listings, agreement sign-offs, and escrow disbursements.
            </p>
            <div className="space-y-2">
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="bg-zinc-900 border border-zinc-700 text-xs px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#dd1515] w-full rounded-l-sm"
                />
                <button className="bg-[#dd1515] hover:bg-[#b00f0f] text-white px-4 font-extrabold text-xs uppercase tracking-wider rounded-r-sm transition-colors">
                  JOIN
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom Info Bar */}
        <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} TransferChain Protocol. All Rights Reserved.</p>
          <div className="flex flex-wrap gap-6 font-medium">
            <Link href="/#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/#" className="hover:text-white transition-colors">Security Disclosures</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
