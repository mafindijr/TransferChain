"use client";

import React, { useState } from "react";

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
  // Wallet Connection Simulation
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Connect wallet helper
  const handleConnectWallet = () => {
    if (walletConnected) {
      setWalletConnected(false);
      setWalletAddress("");
    } else {
      setWalletConnected(true);
      setWalletAddress("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
      addLog(
        "WalletConnected",
        "ProtocolAccess",
        `Wallet 0x71C7...976F connected to Injective EVM`
      );
    }
  };

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
      imageURI: "/img/soccer/soccer-1.jpg",
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
      imageURI: "/img/soccer/soccer-2.jpg",
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
      imageURI: "/img/soccer/soccer-3.jpg",
      status: "Active",
      registeredAt: "2026-07-11 13:20",
      currentClub: "Real Madrid CF",
    },
    {
      id: 4,
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      name: "Jamal Musiala",
      position: "Playmaker",
      age: 23,
      nationality: "Germany",
      metadataURI: "ipfs://bafybeipplayer4",
      imageURI: "/img/soccer/soccer-4.jpg",
      status: "Active",
      registeredAt: "2026-07-12 10:05",
      currentClub: "FC Bayern Munich",
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

  const [logs, setLogs] = useState<TxLog[]>([
    {
      id: "log-1",
      event: "ClubRegistered",
      contract: "ClubRegistry.sol",
      block: 1542031,
      hash: "0xa81f...f291",
      details: "Club Registered: FC Bayern Munich (ID: 1)",
      timestamp: "2026-07-10 14:30",
    },
    {
      id: "log-2",
      event: "PlayerRegistered",
      contract: "PlayerRegistry.sol",
      block: 1542152,
      hash: "0xd92a...c56d",
      details: "Player Registered: Kylian Mbappé (ID: 1)",
      timestamp: "2026-07-10 15:10",
    },
    {
      id: "log-3",
      event: "ListingCreated",
      contract: "TransferMarketplace.sol",
      block: 1546890,
      hash: "0xc18e...eb21",
      details: "Listing #1 created for player Jude Bellingham (Price: 150,000,000 USDC)",
      timestamp: "2026-07-12 14:00",
    },
    {
      id: "log-4",
      event: "OfferMade",
      contract: "TransferMarketplace.sol",
      block: 1549420,
      hash: "0x4efe...a25a",
      details: "Offer made on Listing #1 by Manchester United (Amount: 160,000,000 USDC)",
      timestamp: "2026-07-13 08:20",
    },
  ]);

  // Console Active Form Tab
  const [consoleTab, setConsoleTab] = useState<"club" | "player" | "list" | "offer" | "escrow">("club");

  // Console Form States
  const [clubForm, setClubForm] = useState({
    name: "",
    league: "Premier League",
    country: "",
    city: "",
    website: "",
    logoURI: "/img/match/tf-6.jpg",
    metadataURI: "ipfs://bafybei",
  });

  const [playerForm, setPlayerForm] = useState({
    name: "",
    position: "Forward",
    age: 21,
    nationality: "",
    metadataURI: "ipfs://bafybeipplayer",
    imageURI: "/img/soccer/soccer-1.jpg",
  });

  const [listForm, setListForm] = useState({
    playerId: 1,
    price: 50000000,
    metadataURI: "ipfs://bafybeilisting",
  });

  const [offerForm, setOfferForm] = useState({
    listingId: 1,
    amount: 60000000,
  });

  const [escrowForm, setEscrowForm] = useState({
    agreementId: 1,
    amount: 150000000,
    listingId: 1,
    buyer: "0x32A41f021dde4a25abf6f49291f422e02e825a00",
  });

  // Notifications State
  const [notification, setNotification] = useState<string | null>(null);

  // Helper to trigger UI success notifications
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Helper to add blockchain logs
  const addLog = (event: string, contract: string, details: string) => {
    const randomHash = "0x" + Math.random().toString(16).substring(2, 6) + "..." + Math.random().toString(16).substring(2, 6);
    const blockNum = logs.length > 0 ? logs[0].block + Math.floor(Math.random() * 5) + 1 : 1550000;
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);

    const newLog: TxLog = {
      id: `log-${Date.now()}`,
      event,
      contract,
      block: blockNum,
      hash: randomHash,
      details,
      timestamp: now,
    };

    setLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  // Smart Contract Simulation Actions
  const handleRegisterClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!clubForm.name || !clubForm.country || !clubForm.city) {
      alert("Please fill in all required fields.");
      return;
    }

    const newClub: Club = {
      id: clubs.length + 1,
      owner: walletAddress,
      name: clubForm.name,
      metadataURI: clubForm.metadataURI + Math.random().toString(36).substring(2, 8),
      country: clubForm.country,
      city: clubForm.city,
      league: clubForm.league,
      logoURI: clubForm.logoURI,
      website: clubForm.website || "clubwebsite.com",
      status: "Verified",
      registeredAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setClubs([...clubs, newClub]);
    addLog("ClubRegistered", "ClubRegistry.sol", `Club Registered: ${newClub.name} (ID: ${newClub.id})`);
    triggerNotification(`Club "${newClub.name}" registered successfully on ClubRegistry!`);
    setClubForm({
      name: "",
      league: "Premier League",
      country: "",
      city: "",
      website: "",
      logoURI: "/img/match/tf-6.jpg",
      metadataURI: "ipfs://bafybei",
    });
  };

  const handleRegisterPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    if (!playerForm.name || !playerForm.nationality) {
      alert("Please fill in all required fields.");
      return;
    }

    const newPlayer: Player = {
      id: players.length + 1,
      owner: walletAddress,
      name: playerForm.name,
      metadataURI: playerForm.metadataURI + Math.random().toString(36).substring(2, 8),
      position: playerForm.position,
      age: Number(playerForm.age),
      nationality: playerForm.nationality,
      imageURI: `/img/soccer/soccer-${(players.length % 4) + 1}.jpg`,
      status: "Active",
      registeredAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      currentClub: "Free Agent",
    };

    setPlayers([...players, newPlayer]);
    addLog("PlayerRegistered", "PlayerRegistry.sol", `Player Registered: ${newPlayer.name} (ID: ${newPlayer.id})`);
    triggerNotification(`Player "${newPlayer.name}" registered successfully on PlayerRegistry!`);
    setPlayerForm({
      name: "",
      position: "Forward",
      age: 21,
      nationality: "",
      metadataURI: "ipfs://bafybeipplayer",
      imageURI: "/img/soccer/soccer-1.jpg",
    });
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    const selectedPlayer = players.find((p) => p.id === Number(listForm.playerId));
    if (!selectedPlayer) return;

    // Find if user owns club or if player is registered
    const sellerClub = clubs.find((c) => c.owner.toLowerCase() === walletAddress.toLowerCase()) || clubs[0];

    const newListing: Listing = {
      id: listings.length + 1,
      seller: walletAddress,
      sellerName: sellerClub.name,
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      price: Number(listForm.price),
      metadataURI: listForm.metadataURI + Math.random().toString(36).substring(2, 8),
      status: "Active",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setListings([...listings, newListing]);
    addLog(
      "ListingCreated",
      "TransferMarketplace.sol",
      `Listing #${newListing.id} created for ${newListing.playerName} at price ${newListing.price.toLocaleString()} USDC`
    );
    triggerNotification(`Listing created for player "${newListing.playerName}"!`);
  };

  const handleMakeOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    const selectedListing = listings.find((l) => l.id === Number(offerForm.listingId));
    if (!selectedListing) return;

    const buyerClub = clubs.find((c) => c.owner.toLowerCase() === walletAddress.toLowerCase()) || clubs[2];

    const newOffer: Offer = {
      listingId: selectedListing.id,
      playerName: selectedListing.playerName,
      buyer: walletAddress,
      buyerName: buyerClub.name,
      amount: Number(offerForm.amount),
      status: "Pending",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };

    setOffers([newOffer, ...offers]);
    addLog(
      "OfferMade",
      "TransferMarketplace.sol",
      `Offer made on Listing #${selectedListing.id} by ${newOffer.buyerName} (Amount: ${newOffer.amount.toLocaleString()} USDC)`
    );
    triggerNotification(`Offer of ${newOffer.amount.toLocaleString()} USDC submitted for "${newOffer.playerName}"!`);
  };

  const handleSettleEscrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    const selectedListing = listings.find((l) => l.id === Number(escrowForm.listingId));
    if (!selectedListing) {
      alert("Selected Listing not found.");
      return;
    }

    // Set listing status to Sold, accept matching offers, register logs
    setListings(
      listings.map((l) => (l.id === selectedListing.id ? { ...l, status: "Sold" } : l))
    );

    setOffers(
      offers.map((o) =>
        o.listingId === selectedListing.id ? { ...o, status: "Accepted" } : o
      )
    );

    // Update player's club registry status
    const buyerClub = clubs.find((c) => c.owner.toLowerCase() === escrowForm.buyer.toLowerCase()) || clubs[1];
    setPlayers(
      players.map((p) =>
        p.id === selectedListing.playerId ? { ...p, currentClub: buyerClub.name } : p
      )
    );

    addLog(
      "EscrowDeposited",
      "Escrow.sol",
      `Escrow funded for Listing #${selectedListing.id} by ${buyerClub.name} (Amount: ${selectedListing.price.toLocaleString()} USDC)`
    );
    addLog(
      "TransferAgreed",
      "TransferAgreementManager.sol",
      `Agreement #${escrowForm.agreementId} fully executed for player ${selectedListing.playerName}`
    );
    addLog(
      "EscrowReleased",
      "Escrow.sol",
      `Escrow funds released: ${selectedListing.price.toLocaleString()} USDC. Fee sent to Treasury.`
    );

    triggerNotification(`Escrow settled! Player "${selectedListing.playerName}" has transferred to ${buyerClub.name}.`);
  };

  return (
    <div className="min-h-screen bg-[#151618] text-[#e0e0e0] font-sans selection:bg-[#dd1515] selection:text-white">
      
      {/* Top Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-[#dd1515] text-white border-2 border-white px-6 py-4 rounded-xl shadow-2xl z-[99999] animate-bounce flex items-center gap-3">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold tracking-wide">{notification}</span>
        </div>
      )}

      {/* 1. Header Top Info Bar (Specer style) */}
      <div className="bg-[#111111] border-b border-zinc-800 text-xs py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="text-[#dd1515] font-bold flex items-center gap-1.5 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dd1515]" />
              PROTOCOL OPERATIONAL
            </span>
            <span className="hidden md:inline text-zinc-500">
              NETWORK: <strong className="text-zinc-300">INJECTIVE EVM MAINNET</strong>
            </span>
            <span className="hidden md:inline text-zinc-500">
              GAS: <strong className="text-zinc-300">12 GWEI</strong>
            </span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <a href="#contracts" className="hover:text-white transition-colors">Smart Contracts</a>
            <span>|</span>
            <a href="#console" className="hover:text-white transition-colors">dApp Console</a>
          </div>
        </div>
      </div>

      {/* 2. Main Header / Nav (Specer Theme) */}
      <header className="bg-white text-black shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-20">
          
          {/* Logo & Protocol Title */}
          <div className="flex items-center gap-4">
            <div className="bg-[#dd1515] w-12 h-12 flex items-center justify-center text-white font-extrabold text-xl shadow-md transform hover:rotate-6 transition-transform cursor-pointer">
              TC
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter text-[#111111]">
                TRANSFER<span className="text-[#dd1515]">CHAIN</span>
              </span>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold -mt-1.5">
                ON-CHAIN FOOTBALL REGISTRY & ESCROW
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 font-bold text-sm tracking-wide text-zinc-800">
            <a href="#hero" className="border-b-2 border-[#dd1515] text-[#dd1515] pb-1 hover:text-[#dd1515] transition-all">HOME</a>
            <a href="#live-agreements" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">AGREEMENTS</a>
            <a href="#players" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">PLAYER FEED</a>
            <a href="#activity" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">LEDGER</a>
            <a href="#console" className="border-b-2 border-transparent pb-1 hover:border-[#dd1515] hover:text-[#dd1515] transition-all">CONSOLE</a>
          </nav>

          {/* Wallet Actions */}
          <div className="flex items-center gap-3">
            {walletConnected ? (
              <div className="flex items-center gap-2.5">
                <span className="hidden sm:inline bg-[#f2f2f2] px-3 py-1.5 text-xs font-mono font-bold border border-zinc-300 text-zinc-700 rounded-md">
                  0x71C7...976F
                </span>
                <button
                  id="wallet-disconnect-btn"
                  onClick={handleConnectWallet}
                  className="bg-[#dd1515] hover:bg-[#b00f0f] text-white px-5 py-2.5 text-xs font-bold tracking-wider transition-colors shadow-md"
                >
                  DISCONNECT
                </button>
              </div>
            ) : (
              <button
                id="wallet-connect-btn"
                onClick={handleConnectWallet}
                className="bg-[#111111] hover:bg-[#dd1515] text-white hover:text-white px-6 py-3 text-xs font-bold tracking-wider transition-all duration-300 shadow-md"
              >
                CONNECT WALLET
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Specer Background Style) */}
      <section
        id="hero"
        className="relative bg-cover bg-center py-32 lg:py-48 flex items-center"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(17,17,17,0.95) 40%, rgba(221,21,21,0.15)), url('/img/hero/hero-1.jpg')",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative z-10">
          <div className="max-w-3xl space-y-6">
            
            <div className="inline-block bg-[#dd1515] text-white font-bold text-xs uppercase tracking-widest px-4 py-2">
              DECENTRALIZED SPORTS TRANSFERS
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight uppercase">
              The Smart Contract Layer <br />
              For Professional <span className="text-[#dd1515]">Transfers</span>
            </h1>

            <p className="text-lg text-zinc-300 max-w-xl font-light leading-relaxed">
              TransferChain brings institutional security, decentralized registries, and cryptographic trust to global player transfers. Audit registries, execute agreements, and settle in escrow.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#console"
                className="bg-[#dd1515] hover:bg-white text-white hover:text-black font-bold text-sm tracking-wider uppercase px-8 py-4 transition-all duration-300 shadow-xl"
              >
                Launch Console
              </a>
              <a
                href="#players"
                className="bg-transparent hover:bg-white/10 text-white font-bold text-sm tracking-wider uppercase px-8 py-4 border border-zinc-500 hover:border-white transition-all duration-300"
              >
                Browse Player Feed
              </a>
            </div>
          </div>
        </div>
        
        {/* Decorative Grid Accent */}
        <div className="absolute right-0 bottom-0 w-1/3 h-full opacity-10 pointer-events-none bg-[radial-gradient(#dd1515_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
      </section>

      {/* 4. Live Agreements / Transfers Section (Specer Match Schedule Style) */}
      <section
        id="live-agreements"
        className="py-20 relative bg-cover bg-center"
        style={{
          backgroundImage: "linear-gradient(to bottom, rgba(21,22,24,0.98), rgba(21,22,24,0.95)), url('/img/match/match-bg.jpg')",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Left Column: Pending Agreements */}
            <div className="space-y-6">
              <div className="border-l-4 border-[#dd1515] pl-4">
                <span className="text-xs font-bold text-[#dd1515] tracking-widest uppercase">Contract Negotiator</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Active Transfer Listings</h2>
              </div>
              
              <div className="space-y-4">
                {listings.filter(l => l.status === "Active").map((listing) => (
                  <div key={listing.id} className="bg-[#1a1b1d] border border-zinc-800 p-5 hover:border-[#dd1515] transition-all">
                    <div className="flex justify-between items-center text-xs text-zinc-500 mb-3 border-b border-zinc-800/50 pb-2">
                      <span className="font-mono">LISTING ID: #{listing.id}</span>
                      <span>CREATED: {listing.createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#2a2b2d] flex items-center justify-center text-white font-bold border border-[#dd1515]/30">
                          {listing.playerName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">{listing.playerName}</h4>
                          <p className="text-xs text-zinc-400">Owner: {listing.sellerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#dd1515] font-black text-lg">{listing.price.toLocaleString()} USDC</div>
                        <span className="inline-block bg-[#dd1515]/10 text-[#dd1515] text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 mt-1">
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
                <span className="text-xs font-bold text-[#dd1515] tracking-widest uppercase">Smart Escrow</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Escrow & Offer Settlements</h2>
              </div>

              <div className="space-y-4">
                {offers.map((offer, idx) => (
                  <div key={idx} className="bg-[#1a1b1d] border border-zinc-800 p-5 hover:border-[#dd1515] transition-all">
                    <div className="flex justify-between items-center text-xs text-zinc-500 mb-3 border-b border-zinc-800/50 pb-2">
                      <span className="font-mono">LISTING TARGET: #{offer.listingId}</span>
                      <span>DATE: {offer.createdAt}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-zinc-300 text-xs uppercase tracking-wider">Buyer Club Request</h4>
                        <p className="font-black text-white text-base mt-1">{offer.buyerName}</p>
                        <p className="text-xs text-zinc-400">Target Player: {offer.playerName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-black text-base">{offer.amount.toLocaleString()} USDC</div>
                        <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 mt-1.5 ${
                          offer.status === "Pending" ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                        }`}>
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

      {/* 5. Player Registry Directory (Specer Soccer Feed style) */}
      <section id="players" className="py-20 bg-[#1e1f22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Section Header */}
          <div className="flex justify-between items-end border-b border-zinc-800 pb-5 mb-10">
            <div>
              <span className="text-xs font-bold text-[#dd1515] tracking-widest uppercase">Verified Profiles</span>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Registered Player Directory</h2>
            </div>
            <a href="#console" className="hidden sm:inline bg-zinc-800 hover:bg-[#dd1515] hover:text-white text-zinc-300 font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition-colors">
              + REGISTER NEW PLAYER
            </a>
          </div>

          {/* Grid of Players */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {players.map((player) => (
              <div key={player.id} className="bg-[#151618] border border-zinc-800 overflow-hidden group shadow-lg">
                
                {/* Image Container with zoom-on-hover */}
                <div className="relative h-64 bg-zinc-900 overflow-hidden">
                  <img
                    src={player.imageURI}
                    alt={player.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-[#dd1515] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                    {player.position}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4">
                    <span className="text-xs text-zinc-400 block font-mono">PLAYER ID: #{player.id}</span>
                    <span className="text-xs text-zinc-300 block">{player.nationality}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{player.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Current Club: <strong className="text-zinc-300">{player.currentClub}</strong>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-800/80 pt-3">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px]">Age</span>
                      <strong className="text-zinc-300">{player.age} Years</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[10px]">Status</span>
                      <strong className="text-emerald-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {player.status}
                      </strong>
                    </div>
                  </div>

                  <a
                    href="#console"
                    onClick={() => {
                      setConsoleTab("list");
                      setListForm({ ...listForm, playerId: player.id });
                    }}
                    className="block text-center bg-[#dd1515] hover:bg-white hover:text-black text-white font-bold text-xs uppercase py-3.5 tracking-wider transition-all duration-300"
                  >
                    Transfer Console Action
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Protocol Ledger & Rankings (Specer News & Standings style) */}
      <section id="activity" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Left 8 Columns: Transaction & Event Logs */}
            <div className="lg:col-span-8 space-y-8">
              <div className="border-l-4 border-[#dd1515] pl-4">
                <span className="text-xs font-bold text-[#dd1515] tracking-widest uppercase">Audit Trail</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">On-Chain Registry Logs</h2>
              </div>

              {/* Log Timeline */}
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="bg-[#1e1f22] border border-zinc-800 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-zinc-700 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#dd1515] text-white text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5">
                          {log.event}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">block: {log.block}</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-200">{log.details}</p>
                      <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                        <span>TX: {log.hash}</span>
                        <span>•</span>
                        <span>Contract: {log.contract}</span>
                      </div>
                    </div>
                    
                    <div className="text-zinc-500 text-xs font-mono whitespace-nowrap self-end md:self-center">
                      {log.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 4 Columns: Verified Clubs (Points Table style) */}
            <div className="lg:col-span-4 space-y-8">
              <div className="border-l-4 border-[#dd1515] pl-4">
                <span className="text-xs font-bold text-[#dd1515] tracking-widest uppercase">Identity List</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Verified Club Registry</h2>
              </div>

              <div className="bg-[#1e1f22] border border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#151618] text-xs font-bold uppercase text-zinc-400 border-b border-zinc-800">
                      <th className="py-3 px-4 w-12 text-center">ID</th>
                      <th className="py-3 px-2">Club Name</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-sm">
                    {clubs.map((club) => (
                      <tr key={club.id} className="hover:bg-[#1a1b1d] transition-colors">
                        <td className="py-4 px-4 font-mono text-zinc-500 text-center">{club.id}</td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <img src={club.logoURI} alt="" className="w-6 h-6 rounded-full" />
                            <div>
                              <strong className="text-white block font-bold">{club.name}</strong>
                              <span className="text-[10px] text-zinc-400">{club.league}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
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

      {/* 7. Interactive Protocol Console (Core Actionable Module) */}
      <section id="console" className="py-20 bg-zinc-900/60 border-t border-zinc-800 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="bg-[#dd1515]/10 text-[#dd1515] font-bold text-xs uppercase tracking-widest px-4 py-2">
              DAPP PLAYGROUND
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              TransferChain Console Simulator
            </h2>
            <p className="text-sm text-zinc-400">
              Simulate interacting directly with TransferChain smart contracts on Injective EVM. Connect your wallet above to run contract transactions.
            </p>
          </div>

          <div className="bg-[#151618] border border-zinc-800 rounded-lg overflow-hidden shadow-2xl">
            
            {/* Tabs */}
            <div className="flex border-b border-zinc-800 overflow-x-auto bg-[#111111]">
              {[
                { tab: "club", label: "ClubRegistry.sol" },
                { tab: "player", label: "PlayerRegistry.sol" },
                { tab: "list", label: "TransferMarketplace (List)" },
                { tab: "offer", label: "TransferMarketplace (Offer)" },
                { tab: "escrow", label: "Escrow & Settle" }
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => setConsoleTab(item.tab as any)}
                  className={`py-4 px-6 font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    consoleTab === item.tab
                      ? "bg-[#dd1515] text-white"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Form Panels */}
            <div className="p-8">
              
              {!walletConnected && (
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-md text-center space-y-3 mb-6">
                  <h4 className="text-red-500 font-bold text-sm uppercase tracking-wide">Wallet Not Connected</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    You must connect a Web3 wallet (such as Metamask or Keplr) to simulate sending transaction payloads.
                  </p>
                  <button
                    id="console-connect-wallet-btn"
                    onClick={handleConnectWallet}
                    className="bg-[#dd1515] hover:bg-white text-white hover:text-black text-xs font-bold px-4 py-2 transition-colors uppercase tracking-wider"
                  >
                    Connect Wallet
                  </button>
                </div>
              )}

              {/* CLUB REGISTRY FORM */}
              {consoleTab === "club" && (
                <form onSubmit={handleRegisterClub} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Club Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Arsenal FC"
                        value={clubForm.name}
                        onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">League</label>
                      <select
                        value={clubForm.league}
                        onChange={(e) => setClubForm({ ...clubForm, league: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      >
                        <option>Premier League</option>
                        <option>La Liga</option>
                        <option>Serie A</option>
                        <option>Bundesliga</option>
                        <option>Ligue 1</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Country</label>
                      <input
                        type="text"
                        placeholder="e.g. England"
                        value={clubForm.country}
                        onChange={(e) => setClubForm({ ...clubForm, country: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">City</label>
                      <input
                        type="text"
                        placeholder="e.g. London"
                        value={clubForm.city}
                        onChange={(e) => setClubForm({ ...clubForm, city: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Metadata URI (IPFS Pointer)</label>
                      <input
                        type="text"
                        value={clubForm.metadataURI}
                        onChange={(e) => setClubForm({ ...clubForm, metadataURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm font-mono text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Logo Image URI</label>
                      <input
                        type="text"
                        value={clubForm.logoURI}
                        onChange={(e) => setClubForm({ ...clubForm, logoURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm font-mono text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#b00f0f] text-white disabled:bg-zinc-700 disabled:cursor-not-allowed font-bold text-sm tracking-wider uppercase py-4 transition-colors"
                  >
                    Execute: registerClub()
                  </button>
                </form>
              )}

              {/* PLAYER REGISTRY FORM */}
              {consoleTab === "player" && (
                <form onSubmit={handleRegisterPlayer} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Player Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Bukayo Saka"
                        value={playerForm.name}
                        onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Position</label>
                      <select
                        value={playerForm.position}
                        onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      >
                        <option>Forward</option>
                        <option>Striker</option>
                        <option>Midfielder</option>
                        <option>Defender</option>
                        <option>Goalkeeper</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Age</label>
                      <input
                        type="number"
                        value={playerForm.age}
                        onChange={(e) => setPlayerForm({ ...playerForm, age: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Nationality</label>
                      <input
                        type="text"
                        placeholder="e.g. England"
                        value={playerForm.nationality}
                        onChange={(e) => setPlayerForm({ ...playerForm, nationality: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Metadata URI</label>
                      <input
                        type="text"
                        value={playerForm.metadataURI}
                        onChange={(e) => setPlayerForm({ ...playerForm, metadataURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm font-mono text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#b00f0f] text-white disabled:bg-zinc-700 disabled:cursor-not-allowed font-bold text-sm tracking-wider uppercase py-4 transition-colors"
                  >
                    Execute: registerPlayer()
                  </button>
                </form>
              )}

              {/* CREATE MARKETPLACE LISTING */}
              {consoleTab === "list" && (
                <form onSubmit={handleCreateListing} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Select Player profile</label>
                      <select
                        value={listForm.playerId}
                        onChange={(e) => setListForm({ ...listForm, playerId: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      >
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (ID: #{p.id} - {p.currentClub})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Listing Price (USDC)</label>
                      <input
                        type="number"
                        value={listForm.price}
                        onChange={(e) => setListForm({ ...listForm, price: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Listing Metadata URI</label>
                      <input
                        type="text"
                        value={listForm.metadataURI}
                        onChange={(e) => setListForm({ ...listForm, metadataURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm font-mono text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#b00f0f] text-white disabled:bg-zinc-700 disabled:cursor-not-allowed font-bold text-sm tracking-wider uppercase py-4 transition-colors"
                  >
                    Execute: createListing()
                  </button>
                </form>
              )}

              {/* MAKE TRANSFER OFFER */}
              {consoleTab === "offer" && (
                <form onSubmit={handleMakeOffer} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Target Listing</label>
                      <select
                        value={offerForm.listingId}
                        onChange={(e) => setOfferForm({ ...offerForm, listingId: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      >
                        {listings.filter(l => l.status === "Active").map((l) => (
                          <option key={l.id} value={l.id}>
                            Listing #{l.id} - {l.playerName} (Price: {l.price.toLocaleString()} USDC)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Offer Amount (USDC)</label>
                      <input
                        type="number"
                        value={offerForm.amount}
                        onChange={(e) => setOfferForm({ ...offerForm, amount: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#b00f0f] text-white disabled:bg-zinc-700 disabled:cursor-not-allowed font-bold text-sm tracking-wider uppercase py-4 transition-colors"
                  >
                    Execute: makeOffer()
                  </button>
                </form>
              )}

              {/* ESCROW SETTLEMENT FORM */}
              {consoleTab === "escrow" && (
                <form onSubmit={handleSettleEscrow} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Select Listing to Settle</label>
                      <select
                        value={escrowForm.listingId}
                        onChange={(e) => {
                          const lst = listings.find((l) => l.id === Number(e.target.value));
                          const relatedOffer = offers.find((o) => o.listingId === Number(e.target.value)) || offers[0];
                          setEscrowForm({
                            ...escrowForm,
                            listingId: Number(e.target.value),
                            amount: lst ? lst.price : 10000000,
                            buyer: relatedOffer ? relatedOffer.buyer : "0x32A41f021dde4a25abf6f49291f422e02e825a00",
                          });
                        }}
                        className="w-full px-4 py-3 bg-[#1e1f22] border border-zinc-800 rounded text-sm text-white focus:border-[#dd1515] focus:outline-none"
                      >
                        {listings.filter((l) => l.status === "Active").map((l) => (
                          <option key={l.id} value={l.id}>
                            Listing #{l.id} - {l.playerName} ({l.price.toLocaleString()} USDC)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Settlement Value (USDC)</label>
                      <input
                        type="text"
                        readOnly
                        value={escrowForm.amount.toLocaleString() + " USDC"}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded text-sm font-bold focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Buyer Club Wallet</label>
                      <input
                        type="text"
                        readOnly
                        value={escrowForm.buyer}
                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded text-sm font-mono focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected || listings.filter(l => l.status === "Active").length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-700 disabled:cursor-not-allowed font-bold text-sm tracking-wider uppercase py-4 transition-colors"
                  >
                    Execute: fundAndReleaseEscrow()
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* 8. Smart Contracts List Section */}
      <section id="contracts" className="py-20 bg-[#151618] border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-bold text-[#dd1515] tracking-widest uppercase">Ecosystem Contracts</span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Smart Contract Repository</h2>
            <p className="text-sm text-zinc-400">
              Here is the modular structure of the smart contract architecture implemented in the <code className="text-zinc-200">TransferChain-Contracts</code> directory.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "ClubRegistry.sol",
                desc: "Registers and maintains verified profiles for athletic clubs globally, mapping controller wallets to structured metadata.",
                methods: "registerClub(), updateClubMetadata(), setClubStatus()"
              },
              {
                name: "PlayerRegistry.sol",
                desc: "Handles player identities with decentralized metadata, enabling verified control, age records, and performance links.",
                methods: "registerPlayer(), updatePlayerMetadata(), setPlayerStatus()"
              },
              {
                name: "TransferMarketplace.sol",
                desc: "Facilitates trustless player transfer listings, bidding, and price discoveries in an audit-ready interface.",
                methods: "createListing(), cancelListing(), makeOffer(), rejectOffer()"
              },
              {
                name: "TransferAgreementManager.sol",
                desc: "Manages negotiation parameters, tripartite signatures, and terms between seller clubs, buyer clubs, and players.",
                methods: "createAgreement(), approveAgreement(), signAgreement()"
              },
              {
                name: "Escrow.sol",
                desc: "Secures transfer fees in smart contracts, holding buyer deposits and releasing payouts upon signed agreement verification.",
                methods: "depositFunds(), releaseFunds(), refundFunds()"
              },
              {
                name: "Treasury.sol",
                desc: "Manages protocol fee cuts, withdraws protocol-earned revenues, and establishes supported payment tokens.",
                methods: "depositRevenue(), withdrawFees(), updateTokenStatus()"
              }
            ].map((contract, index) => (
              <div key={index} className="bg-[#1e1f22] border border-zinc-800 p-6 space-y-4 hover:border-zinc-700 transition-all">
                <div className="w-10 h-10 bg-[#dd1515]/10 text-[#dd1515] font-mono font-bold flex items-center justify-center border border-[#dd1515]/20">
                  {`0${index + 1}`}
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">{contract.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{contract.desc}</p>
                <div className="pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Key ABI Methods</span>
                  <code className="text-xs text-[#dd1515] font-mono block mt-1">{contract.methods}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer (Specer Footer Background Style) */}
      <footer
        className="relative bg-[#111111] text-zinc-400 py-16 border-t border-zinc-900 bg-cover bg-center"
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
              <p className="text-xs leading-relaxed">
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
              <h4 className="text-white font-bold text-sm uppercase tracking-wider border-b border-[#dd1515] pb-2 inline-block">
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

          <div className="mt-12 pt-8 border-t border-zinc-850 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
            <p>© {new Date().getFullYear()} TransferChain Protocol. All Rights Reserved. Designed with Specer Sports Theme.</p>
            <div className="flex gap-6 text-zinc-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security Disclosures</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
