"use client";

import React from "react";

export default function Footer() {
  return (
    <footer
      className="relative bg-[#111111] text-zinc-400 py-16 border-t border-zinc-950 bg-cover bg-center"
      style={{
        backgroundImage: "linear-gradient(to top, rgba(17,17,17,0.99), rgba(17,17,17,0.92)), url('/img/footer-bg.jpg')",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <span className="text-2xl font-black tracking-tighter text-white uppercase">
              TRANSFER<span className="text-[#dd1515]">CHAIN</span>
            </span>
            <p className="text-xs leading-relaxed text-zinc-400">
              A trustless settlement registry and transfer escrow built on smart contracts. We ensure safety, accuracy, and compliance for professional sports transfers.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#dd1515] pb-2 inline-block">
              Smart Contracts
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li><a href="#contracts" className="hover:text-white transition-colors">ClubRegistry.sol</a></li>
              <li><a href="#contracts" className="hover:text-white transition-colors">PlayerRegistry.sol</a></li>
              <li><a href="#contracts" className="hover:text-white transition-colors">TransferMarketplace.sol</a></li>
              <li><a href="#contracts" className="hover:text-white transition-colors">Escrow.sol</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#dd1515] pb-2 inline-block">
              Documentation
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Protocol Architecture</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Zero-Knowledge Specs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Audit Reports</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Developer SDK Docs</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider border-[#dd1515] pb-2 inline-block">
              Newsletter
            </h4>
            <p className="text-xs">
              Sign up to receive updates on settled transfers, registry listings, and protocol events.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter email"
                className="bg-zinc-800 border border-zinc-700 text-xs px-3 py-2 text-white focus:outline-none w-full"
              />
              <button className="bg-[#dd1515] hover:bg-[#b00f0f] text-white px-4 font-bold text-xs uppercase tracking-wider">
                SEND
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} TransferChain Protocol. All Rights Reserved. Designed with Specer Sports Theme.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Disclosures</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
