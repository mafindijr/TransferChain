"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import Link from "next/link";

// Types corresponding to TransferChain Smart Contracts
interface Club {
  id: number;
  owner: string;
  name: string;
  metadataURI: string;
  country: string;
  city: string;
  league: string;
  logoURI: string;
  website: string;
  status: string; // Verified, Unverified, Suspended
  registeredAt: string;
}

interface Player {
  id: number;
  owner: string;
  name: string;
  metadataURI: string;
  position: string;
  age: number;
  nationality: string;
  imageURI: string;
  status: string; // Active, Suspended, Inactive
  registeredAt: string;
  currentClub: string;
}

interface Listing {
  id: number;
  seller: string;
  sellerName: string;
  playerId: number;
  playerName: string;
  price: number; // in USDC
  metadataURI: string;
  status: string; // Active, Cancelled, Sold
  createdAt: string;
}

interface Offer {
  listingId: number;
  playerName: string;
  buyer: string;
  buyerName: string;
  amount: number; // in USDC
  status: string; // Pending, Accepted, Rejected, Expired
  createdAt: string;
}

interface TxLog {
  id: string;
  event: string;
  contract: string;
  block: number;
  hash: string;
  details: string;
  timestamp: string;
}

export default function Home() {
  // World Cup Loader States
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("Initializing TransferChain Protocol...");

  useEffect(() => {
    const steps = [
      { prg: 0, text: "Initializing TransferChain Protocol..." },
      { prg: 15, text: "Syncing Injective EVM Node..." },
      { prg: 35, text: "Fetching World Cup Escrow smart contracts..." },
      { prg: 55, text: "Decrypting Player tri-partite agreement hashes..." },
      { prg: 75, text: "Verifying Verified Club Registry state..." },
      { prg: 90, text: "Securing ledger endpoints..." },
      { prg: 100, text: "Sync Complete! Access Granted." }
    ];

    let timer: NodeJS.Timeout;
    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const nextPrg = prev + Math.floor(Math.random() * 8) + 4;
        if (nextPrg >= 100) {
          clearInterval(interval);
          setLoadingStep(steps[steps.length - 1].text);
          timer = setTimeout(() => setFadeOut(true), 400);
          setTimeout(() => setLoading(false), 1100); // 400ms delay + 700ms fadeOut transition
          return 100;
        }

        const current = steps.find((s, idx) => {
          const next = steps[idx + 1];
          return nextPrg >= s.prg && (!next || nextPrg < next.prg);
        });
        if (current) {
          setLoadingStep(current.text);
        }

        return nextPrg;
      });
    }, 60);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // Web3 Connection hooks
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const walletConnected = isConnected;
  const walletAddress = address || "";

  // State arrays populated with Specer Theme references & TransferChain contract parameters
  const [clubs, setClubs] = useState<Club[]>([
    {
      id: 1,
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      name: "FC Bayern Munich",
      metadataURI: "ipfs://bafybeicclub1",
      country: "Germany",
      city: "Munich",
      league: "Bundesliga",
      logoURI: "/img/match/tf-1.jpg",
      website: "fcbayern.com",
      status: "Verified",
      registeredAt: "2026-07-10 14:30",
    },
    {
      id: 2,
      owner: "0x97E10294bc12689c258f121d5192c0ab422e02e8",
      name: "Real Madrid CF",
      metadataURI: "ipfs://bafybeicclub2",
      country: "Spain",
      city: "Madrid",
      league: "La Liga",
      logoURI: "/img/match/tf-2.jpg",
      website: "realmadrid.com",
      status: "Verified",
      registeredAt: "2026-07-11 09:15",
    },
    {
      id: 3,
      owner: "0x32A41f021dde4a25abf6f49291f422e02e825a00",
      name: "Manchester United",
      metadataURI: "ipfs://bafybeicclub3",
      country: "England",
      city: "Manchester",
      league: "Premier League",
      logoURI: "/img/match/tf-3.jpg",
      website: "manutd.com",
      status: "Verified",
      registeredAt: "2026-07-11 18:45",
    },
    {
      id: 4,
      owner: "0x5B8f91a2bc01f4efee8d9a881b05e3000321dde4",
      name: "Paris Saint-Germain",
      metadataURI: "ipfs://bafybeicclub4",
      country: "France",
      city: "Paris",
      league: "Ligue 1",
      logoURI: "/img/match/tf-4.jpg",
      website: "psg.fr",
      status: "Verified",
      registeredAt: "2026-07-12 11:20",
    },
    {
      id: 5,
      owner: "0x12d3e543bc10294abf6f49291f422e02e825a002",
      name: "Juventus FC",
      metadataURI: "ipfs://bafybeicclub5",
      country: "Italy",
      city: "Turin",
      league: "Serie A",
      logoURI: "/img/match/tf-5.jpg",
      website: "juventus.com",
      status: "Verified",
      registeredAt: "2026-07-12 15:55",
    },
  ]);

  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      name: "Kylian Mbappé",
      metadataURI: "ipfs://bafybeipplayer1",
      position: "Forward",
      age: 27,
      nationality: "France",
      imageURI: "/img/players/Mbappe.jpg",
      status: "Active",
      registeredAt: "2026-07-10 15:10",
      currentClub: "FC Bayern Munich",
    },
    {
      id: 2,
      owner: "0x32A41f021dde4a25abf6f49291f422e02e825a00",
      name: "Erling Haaland",
      position: "Striker",
      age: 25,
      nationality: "Norway",
      metadataURI: "ipfs://bafybeipplayer2",
      imageURI: "/img/players/Haaland.png",
      status: "Active",
      registeredAt: "2026-07-11 11:00",
      currentClub: "Manchester United",
    },
    {
      id: 3,
      owner: "0x97E10294bc12689c258f121d5192c0ab422e02e8",
      name: "Jude Bellingham",
      position: "Midfielder",
      age: 23,
      nationality: "England",
      metadataURI: "ipfs://bafybeipplayer3",
      imageURI: "/img/players/Jude.png",
      status: "Active",
      registeredAt: "2026-07-11 13:20",
      currentClub: "Real Madrid CF",
    },
    
  ]);

  const [listings, setListings] = useState<Listing[]>([
    {
      id: 1,
      seller: "0x97E10294bc12689c258f121d5192c0ab422e02e8",
      sellerName: "Real Madrid CF",
      playerId: 3,
      playerName: "Jude Bellingham",
      price: 150000000,
      metadataURI: "ipfs://bafybeilisting1",
      status: "Active",
      createdAt: "2026-07-12 14:00",
    },
    {
      id: 2,
      seller: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      sellerName: "FC Bayern Munich",
      playerId: 4,
      playerName: "Jamal Musiala",
      price: 130000000,
      metadataURI: "ipfs://bafybeilisting2",
      status: "Active",
      createdAt: "2026-07-12 16:30",
    },
  ]);

  const [offers, setOffers] = useState<Offer[]>([
    {
      listingId: 1,
      playerName: "Jude Bellingham",
      buyer: "0x32A41f021dde4a25abf6f49291f422e02e825a00",
      buyerName: "Manchester United",
      amount: 160000000,
      status: "Pending",
      createdAt: "2026-07-13 08:20",
    },
    {
      listingId: 2,
      playerName: "Jamal Musiala",
      buyer: "0x5B8f91a2bc01f4efee8d9a881b05e3000321dde4",
      buyerName: "Paris Saint-Germain",
      amount: 125000000,
      status: "Pending",
      createdAt: "2026-07-13 10:15",
    },
  ]);


  const [isMounted, setIsMounted] = useState(false);

  
  
  
  // Helper to trigger UI success notifications
  const triggerNotification = (msg: string) => {
    toast.success(msg);
  };

  
  

    
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
      
      {/* World Cup Loader Overlay */}
      {loading && (
        <div className={`fixed inset-0 bg-[#08090a] z-[999999] flex flex-col items-center justify-center p-6 select-none transition-all duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {/* Abstract Background Lights */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#dd1515]/5 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl animate-gold-glow" />
          
          {/* Outer Container */}
          <div className="relative flex flex-col items-center max-w-md w-full text-center space-y-8 animate-slide-up">
            
            {/* World Cup Trophy with Orbiting Ball */}
            <div className="relative flex items-center justify-center w-52 h-52">
              <svg className="w-36 h-36 text-amber-500 animate-gold-glow animate-float" viewBox="0 0 100 120" fill="currentColor">
                <defs>
                  <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#78350f" />
                  </linearGradient>
                  <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <circle cx="50" cy="55" r="40" fill="url(#glow-grad)" />

                {/* Pedestal Base */}
                <rect x="30" y="102" width="40" height="12" rx="2" fill="#1e293b" />
                <rect x="33" y="95" width="34" height="7" fill="url(#gold-grad)" />
                <path d="M 37,95 L 40,82 L 60,82 L 63,95 Z" fill="#0f172a" stroke="url(#gold-grad)" strokeWidth="1.5" />
                
                {/* Stem / Body */}
                <path d="M 43,82 Q 50,75 42,50 Q 34,35 44,24 L 56,24 Q 66,35 58,50 Q 50,75 57,82 Z" fill="url(#gold-grad)" />
                
                {/* Supporting Figures wrapping the globe */}
                <path d="M 39,52 Q 28,45 28,30 Q 28,15 40,20 Q 44,22 43,30 Q 36,28 36,38 Q 36,46 41,51 Z" fill="url(#gold-grad)" opacity="0.95" />
                <path d="M 61,52 Q 72,45 72,30 Q 72,15 60,20 Q 56,22 57,30 Q 64,28 64,38 Q 64,46 59,51 Z" fill="url(#gold-grad)" opacity="0.95" />
                
                {/* The Globe */}
                <circle cx="50" cy="24" r="13" fill="url(#gold-grad)" />
                {/* Globe lines */}
                <path d="M 37,24 A 13,13 0 0,0 63,24" fill="none" stroke="#78350f" strokeWidth="1" />
                <path d="M 50,11 A 13,13 0 0,0 50,37" fill="none" stroke="#78350f" strokeWidth="1" />
                <path d="M 40,16 Q 50,26 60,16" fill="none" stroke="#78350f" strokeWidth="0.8" />
                <path d="M 40,32 Q 50,22 60,32" fill="none" stroke="#78350f" strokeWidth="0.8" />
              </svg>

              {/* Orbiting Soccer Ball */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  <svg className="absolute inset-0 w-full h-full text-amber-500/25 -rotate-12" viewBox="0 0 100 100">
                    <ellipse cx="50" cy="50" rx="42" ry="14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 w-5 h-5 -ml-2.5 -mt-2.5 bg-white rounded-full border-2 border-zinc-950 flex items-center justify-center animate-orbit shadow-lg shadow-amber-500/30">
                    <div className="w-2 h-2 bg-zinc-950 rounded-full flex items-center justify-center">
                      <div className="w-0.5 h-0.5 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Titles */}
            <div className="space-y-2">
              <span className="text-amber-500 font-extrabold text-[10px] uppercase tracking-widest bg-amber-500/10 px-3.5 py-1.5 border border-amber-500/20 rounded">
                🏆 WORLD CUP ESCROW INTEGRITY
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase mt-2">
                TRANSFER<span className="text-[#dd1515]">CHAIN</span>
              </h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                Secure Athletic Transfers Protocol
              </p>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full space-y-3">
              <div className="w-full bg-zinc-950 border border-zinc-800/80 h-2.5 p-0.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#dd1515] to-amber-500 h-full rounded-full transition-all duration-100 shadow-[0_0_10px_rgba(221,21,21,0.5)]"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                <span className="animate-pulse">{loadingStep}</span>
                <span className="font-bold text-zinc-300">{loadingProgress}%</span>
              </div>
            </div>

            {/* Skip Button */}
            <button 
              onClick={() => {
                setFadeOut(true);
                setTimeout(() => setLoading(false), 700);
              }}
              className="border border-zinc-800 hover:border-amber-500 text-zinc-500 hover:text-amber-500 text-[10px] uppercase tracking-widest font-black px-6 py-2.5 rounded transition-all duration-300 hover:bg-amber-500/5 cursor-pointer"
            >
              Skip Intro
            </button>
          </div>
        </div>
      )}

      {/* Top Notification Toast */}

      <Header />

      {/* 3. Hero Section (Specer Background Style: High contrast sports header) */}
      <section
        id="hero"
        className="relative bg-cover bg-center py-28 lg:py-36 flex items-center overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(17,17,17,0.97) 40%, rgba(221,21,21,0.15) 85%, rgba(17,17,17,0.95)), url('/img/hero/hero-1.jpg')",
        }}
      >
        {/* Glow Spheres */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-[#dd1515]/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-gold-glow" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left side text column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#dd1515] text-white font-extrabold text-[10px] uppercase tracking-widest px-4 py-2 rounded-sm shadow-[0_4px_12px_rgba(221,21,21,0.3)] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                DECENTRALIZED SPORTS TRANSFERS
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight uppercase">
                The Smart Contract Layer <br />
                For Professional <span className="text-[#dd1515]">Transfers</span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 max-w-xl font-light leading-relaxed">
                TransferChain brings institutional security, decentralized registries, and cryptographic trust to global player transfers. Audit registries, execute agreements, and settle in escrow.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="#console"
                  className="bg-[#dd1515] hover:bg-white text-white hover:text-black font-extrabold text-xs tracking-wider uppercase px-8 py-4 transition-all duration-300 shadow-[0_4px_20px_rgba(221,21,21,0.25)] hover:shadow-white/10 transform hover:-translate-y-0.5"
                >
                  Launch Console
                </a>
                <a
                  href="#players"
                  className="bg-transparent hover:bg-white/10 text-white font-extrabold text-xs tracking-wider uppercase px-8 py-4 border border-zinc-500 hover:border-white transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  Browse Player Feed
                </a>
              </div>
            </div>

            {/* Right side trophy showcase column */}
            <div className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center bg-[#141517]/90 backdrop-blur-md border border-zinc-800/80 p-8 rounded shadow-2xl relative overflow-hidden group animate-float">
              {/* Background decorative glows */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#dd1515]/5 rounded-full blur-2xl group-hover:bg-[#dd1515]/10 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
              
              {/* World Cup Trophy SVG in Hero */}
              <div className="relative w-44 h-44 flex items-center justify-center mb-6">
                <svg className="w-32 h-32 text-amber-500 animate-gold-glow" viewBox="0 0 100 120" fill="currentColor">
                  {/* Pedestal Base */}
                  <rect x="30" y="102" width="40" height="12" rx="2" fill="#1e293b" />
                  <rect x="33" y="95" width="34" height="7" fill="url(#gold-grad)" />
                  <path d="M 37,95 L 40,82 L 60,82 L 63,95 Z" fill="#0f172a" stroke="url(#gold-grad)" strokeWidth="1.5" />
                  
                  {/* Stem / Body */}
                  <path d="M 43,82 Q 50,75 42,50 Q 34,35 44,24 L 56,24 Q 66,35 58,50 Q 50,75 57,82 Z" fill="url(#gold-grad)" />
                  
                  {/* Supporting Figures wrapping the globe */}
                  <path d="M 39,52 Q 28,45 28,30 Q 28,15 40,20 Q 44,22 43,30 Q 36,28 36,38 Q 36,46 41,51 Z" fill="url(#gold-grad)" opacity="0.95" />
                  <path d="M 61,52 Q 72,45 72,30 Q 72,15 60,20 Q 56,22 57,30 Q 64,28 64,38 Q 64,46 59,51 Z" fill="url(#gold-grad)" opacity="0.95" />
                  
                  {/* The Globe */}
                  <circle cx="50" cy="24" r="13" fill="url(#gold-grad)" />
                </svg>
                
                {/* Orbiting Ring */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-40 h-40">
                    <svg className="absolute inset-0 w-full h-full text-amber-500/25 -rotate-12" viewBox="0 0 100 100">
                      <ellipse cx="50" cy="50" rx="38" ry="12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 3" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 bg-white rounded-full border-2 border-zinc-950 flex items-center justify-center animate-orbit shadow-md" />
                  </div>
                </div>
              </div>

              {/* Showcase stats */}
              <div className="w-full text-center space-y-2 border-t border-zinc-800/80 pt-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">World Cup Escrow Pool</span>
                <h4 className="text-2xl font-black text-white">$450,000,000 USDC</h4>
                <div className="flex justify-center gap-4 text-[10px] font-bold text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    SECURED
                  </span>
                  <span>•</span>
                  <span>AUDITED BY OAK SECURITY</span>
                </div>
              </div>
            </div>

          </div>
        </div>
        
        {/* Decorative Grid Accent */}
        <div className="absolute right-0 bottom-0 w-1/3 h-full opacity-10 pointer-events-none bg-[radial-gradient(#dd1515_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
      </section>

      {/* 4. Live Agreements / Transfers Section (Specer Match Schedule Style: Dark graphic backdrop) */}
      <section
        id="live-agreements"
        className="py-20 relative bg-cover bg-center border-b border-zinc-200"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(21,22,24,0.98), rgba(21,22,24,0.95)), url('/img/match/match-bg.jpg')",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Left Column: Pending Agreements */}
            <div className="space-y-6">
              <div className="border-l-4 border-[#dd1515] pl-4">
                <span className="text-xs font-extrabold text-[#dd1515] tracking-widest uppercase">Contract Negotiator</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Active Transfer Listings</h2>
              </div>
              
              <div className="space-y-4">
                {listings.filter(l => l.status === "Active").map((listing) => (
                  <div key={listing.id} className="bg-[#1a1b1d]/95 border border-zinc-800 p-5 hover:border-[#dd1515] hover:shadow-[0_4px_25px_rgba(221,21,21,0.15)] hover:-translate-y-0.5 transition-all duration-300 rounded-sm">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-3 border-b border-zinc-800/50 pb-2">
                      <span className="font-mono">LISTING ID: #{listing.id}</span>
                      <span>CREATED: {listing.createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-[#2a2b2d] flex items-center justify-center text-white font-bold border border-[#dd1515]/30">
                          {listing.playerName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">{listing.playerName}</h4>
                          <p className="text-xs text-zinc-400">Owner: {listing.sellerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#dd1515] font-black text-lg">{listing.price.toLocaleString()} USDC</div>
                        <span className="inline-flex items-center gap-1 bg-[#dd1515]/10 text-[#dd1515] text-[9px] uppercase font-black tracking-wider px-2.5 py-1 mt-1 border border-[#dd1515]/20 rounded-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#dd1515] animate-pulse" />
                          ACTIVE LISTING
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Pending Offers & Escrow (Replicating Results style) */}
            <div className="space-y-6">
              <div className="border-l-4 border-[#dd1515] pl-4">
                <span className="text-xs font-extrabold text-[#dd1515] tracking-widest uppercase">Smart Escrow</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Escrow & Offer Settlements</h2>
              </div>

              <div className="space-y-4">
                {offers.map((offer, idx) => (
                  <div key={idx} className="bg-[#1a1b1d]/95 border border-zinc-800 p-5 hover:border-[#dd1515] hover:shadow-[0_4px_25px_rgba(221,21,21,0.15)] hover:-translate-y-0.5 transition-all duration-300 rounded-sm">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-3 border-b border-zinc-800/50 pb-2">
                      <span className="font-mono">LISTING TARGET: #{offer.listingId}</span>
                      <span>DATE: {offer.createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-zinc-400 text-[10px] uppercase tracking-wider">Buyer Club Request</h4>
                        <p className="font-black text-white text-base mt-1">{offer.buyerName}</p>
                        <p className="text-xs text-zinc-400">Target Player: {offer.playerName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-black text-base">{offer.amount.toLocaleString()} USDC</div>
                        <span className={`inline-flex items-center gap-1 text-[9px] uppercase font-black tracking-wider px-2.5 py-1 mt-1.5 rounded-sm border ${
                          offer.status === "Pending" 
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                            : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${offer.status === "Pending" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                          OFFER {offer.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Player Registry Directory (Specer Soccer Feed style: Totally Light Theme Cards) */}
      <section id="players" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Section Header */}
          <div className="flex justify-between items-end border-b border-zinc-200 pb-5 mb-10">
            <div>
              <span className="text-xs font-extrabold text-[#dd1515] tracking-widest uppercase">Verified Profiles</span>
              <h2 className="text-3xl font-black text-zinc-950 uppercase tracking-tight">Marketplace</h2>
            </div>
            <div className="hidden sm:flex gap-3">
              <Link
                href="/register-player"
                className="bg-zinc-900 hover:bg-[#dd1515] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-3.5 transition-colors"
              >
                + Register Player
              </Link>
              <Link
                href="/clubs/register"
                className="bg-zinc-100 hover:bg-[#dd1515] hover:text-white text-zinc-900 font-extrabold text-xs uppercase tracking-wider px-4 py-3.5 transition-colors border border-zinc-300"
              >
                + Register Club
              </Link>
            </div>
          </div>

          {/* Grid of Players */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {players.map((player) => (
              <div key={player.id} className="bg-white border border-zinc-200 overflow-hidden group shadow-md hover:shadow-2xl hover:border-[#dd1515]/30 hover:-translate-y-2.5 transition-all duration-500 ease-out rounded-sm">
                
                {/* Image Container with zoom-on-hover */}
                <Link href={`/player/${player.id}`} className="block relative h-64 bg-zinc-100 overflow-hidden">
                  <img
                    src={player.imageURI}
                    alt={player.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-[#dd1515] text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1">
                    {player.position}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 z-10">
                    <span className="text-xs text-zinc-300 block font-mono">PLAYER ID: #{player.id}</span>
                    <span className="text-xs text-zinc-200 block font-medium">{player.nationality}</span>
                  </div>
                </Link>

                {/* Content (Specer Card layout) */}
                <div className="p-5 space-y-4">
                  <div>
                    <Link href={`/player/${player.id}`} className="hover:text-[#dd1515] transition-colors">
                      <h3 className="text-lg font-black text-zinc-950 uppercase tracking-tight">{player.name}</h3>
                    </Link>
                    <p className="text-xs text-zinc-500 mt-1">
                      Current Club: <strong className="text-zinc-800 font-bold">{player.currentClub}</strong>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-3">
                    <div>
                      <span className="text-zinc-400 block uppercase text-[9px] font-extrabold">Age</span>
                      <strong className="text-zinc-700 font-bold">{player.age} Years</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 block uppercase text-[9px] font-extrabold">Status</span>
                      <strong className="text-emerald-600 flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {player.status}
                      </strong>
                    </div>
                  </div>

                  <a
                    href="#console"
                    
                    className="block text-center bg-[#dd1515] hover:bg-zinc-950 text-white font-extrabold text-xs uppercase py-3.5 tracking-wider transition-all duration-300"
                  >
                    Buy Player
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Protocol Ledger & Rankings (Specer News & Standings style: Light Background layout) */}
      <section id="activity" className="py-20 bg-[#f4f5f8] border-t border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Left 8 Columns: Transaction & Event Logs */}
            <div className="lg:col-span-8 space-y-8">
              <div className="border-l-4 border-[#dd1515] pl-4">
                <span className="text-xs font-extrabold text-[#dd1515] tracking-widest uppercase">Audit Trail</span>
                <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tight">On-Chain Registry Logs</h2>
              </div>
            </div>

            {/* Right 4 Columns: Verified Clubs (Points Table style: Light theme standings table) */}
            <div className="lg:col-span-4 space-y-8">
              <div className="border-l-4 border-[#dd1515] pl-4">
                <span className="text-xs font-extrabold text-[#dd1515] tracking-widest uppercase">Identity List</span>
                <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tight">Verified Club Registry</h2>
              </div>

              <div className="bg-white border border-zinc-200 overflow-hidden shadow-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#111111] text-xs font-black uppercase text-zinc-200 border-b border-zinc-200">
                      <th className="py-4 px-4 w-12 text-center">ID</th>
                      <th className="py-4 px-2">Club Name</th>
                      <th className="py-4 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-sm text-zinc-850">
                    {clubs.map((club) => (
                      <tr key={club.id} className="hover:bg-zinc-50/80 hover:translate-x-0.5 transition-all duration-300 group/row">
                        <td className="py-4 px-4 font-mono text-zinc-400 text-center">{club.id}</td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <img src={club.logoURI} alt="" className="w-6 h-6 rounded-full border border-zinc-200 group-hover/row:scale-110 transition-transform duration-300" />
                            <div>
                              <strong className="text-zinc-900 block font-extrabold">{club.name}</strong>
                              <span className="text-[10px] text-zinc-500">{club.league}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block bg-emerald-500/10 text-emerald-600 text-[9px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider border border-emerald-500/20">
                            {club.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
