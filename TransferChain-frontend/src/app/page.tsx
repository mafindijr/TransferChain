"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import React, { useState, useEffect } from "react";

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
    {
      id: 4,
      owner: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      name: "Jamal Musiala",
      position: "Playmaker",
      age: 23,
      nationality: "Germany",
      metadataURI: "ipfs://bafybeipplayer4",
      imageURI: "/img/players/Musiala.jpg",
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
      {notification && (
        <div className="fixed bottom-6 right-6 bg-[#dd1515] text-white border-2 border-white px-6 py-4 rounded shadow-2xl z-[99999] animate-bounce flex items-center gap-3">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold tracking-wide">{notification}</span>
        </div>
      )}

      <Header
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        handleConnectWallet={handleConnectWallet}
      />

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
            <a href="#console" className="hidden sm:inline bg-zinc-900 hover:bg-[#dd1515] text-white font-extrabold text-xs uppercase tracking-wider px-4 py-3.5 transition-colors">
              + Register New Player
            </a>
          </div>

          {/* Grid of Players */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {players.map((player) => (
              <div key={player.id} className="bg-white border border-zinc-200 overflow-hidden group shadow-md hover:shadow-2xl hover:border-[#dd1515]/30 hover:-translate-y-2.5 transition-all duration-500 ease-out rounded-sm">
                
                {/* Image Container with zoom-on-hover */}
                <div className="relative h-64 bg-zinc-100 overflow-hidden">
                  <img
                    src={player.imageURI}
                    alt={player.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-[#dd1515] text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-1">
                    {player.position}
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4">
                    <span className="text-xs text-zinc-300 block font-mono">PLAYER ID: #{player.id}</span>
                    <span className="text-xs text-zinc-200 block font-medium">{player.nationality}</span>
                  </div>
                </div>

                {/* Content (Specer Card layout) */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-zinc-950 uppercase tracking-tight">{player.name}</h3>
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
                    onClick={() => {
                      setConsoleTab("list");
                      setListForm({ ...listForm, playerId: player.id });
                    }}
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

              {/* Log Timeline (Specer News block layout: Clean white cards) */}
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="bg-white border border-zinc-200 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-[#dd1515]/20 hover:shadow-md hover:translate-x-1 transition-all duration-300 shadow-sm rounded-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#dd1515] text-white text-[9px] font-mono uppercase font-black tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                          {log.event}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">block: {log.block}</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-800">{log.details}</p>
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

      {/* 7. Interactive Protocol Console (Totally Light Dashboard Style) */}
      <section id="console" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="bg-[#dd1515]/10 text-[#dd1515] font-extrabold text-xs uppercase tracking-widest px-4 py-2 border border-[#dd1515]/20">
              DAPP PLAYGROUND
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 uppercase tracking-tight">
              TransferChain Console Simulator
            </h2>
            <p className="text-sm text-zinc-500">
              Simulate interacting directly with TransferChain smart contracts on Injective EVM. Connect your wallet above to run contract transactions.
            </p>
          </div>

          <div className="bg-[#fcfdfe] border border-zinc-200 rounded overflow-hidden shadow-lg">
            
            {/* Tabs */}
            <div className="flex border-b border-zinc-200 overflow-x-auto bg-[#f1f3f6]">
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
                  className={`py-4.5 px-6 font-extrabold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                    consoleTab === item.tab
                      ? "bg-[#dd1515] text-white border-b-2 border-[#dd1515]"
                      : "text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Form Panels */}
            <div className="p-8 bg-white">
              
              {!walletConnected && (
                <div className="bg-red-500/5 border border-red-500/25 p-6 rounded text-center space-y-3 mb-6">
                  <h4 className="text-red-600 font-extrabold text-sm uppercase tracking-wide">Wallet Not Connected</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    You must connect a Web3 wallet (such as Metamask or Keplr) to simulate sending transaction payloads.
                  </p>
                  <button
                    id="console-connect-wallet-btn"
                    onClick={handleConnectWallet}
                    className="bg-[#dd1515] hover:bg-[#111111] text-white text-xs font-bold px-5 py-2.5 transition-colors uppercase tracking-wider"
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
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Club Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Arsenal FC"
                        value={clubForm.name}
                        onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">League</label>
                      <select
                        value={clubForm.league}
                        onChange={(e) => setClubForm({ ...clubForm, league: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      >
                        <option>Premier League</option>
                        <option>La Liga</option>
                        <option>Serie A</option>
                        <option>Bundesliga</option>
                        <option>Ligue 1</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Country</label>
                      <input
                        type="text"
                        placeholder="e.g. England"
                        value={clubForm.country}
                        onChange={(e) => setClubForm({ ...clubForm, country: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">City</label>
                      <input
                        type="text"
                        placeholder="e.g. London"
                        value={clubForm.city}
                        onChange={(e) => setClubForm({ ...clubForm, city: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Metadata URI (IPFS Pointer)</label>
                      <input
                        type="text"
                        value={clubForm.metadataURI}
                        onChange={(e) => setClubForm({ ...clubForm, metadataURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm font-mono text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Logo Image URI</label>
                      <input
                        type="text"
                        value={clubForm.logoURI}
                        onChange={(e) => setClubForm({ ...clubForm, logoURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm font-mono text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#111111] text-white disabled:bg-zinc-350 disabled:cursor-not-allowed font-extrabold text-sm tracking-wider uppercase py-4 transition-colors"
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
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Player Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Bukayo Saka"
                        value={playerForm.name}
                        onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Position</label>
                      <select
                        value={playerForm.position}
                        onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      >
                        <option>Forward</option>
                        <option>Striker</option>
                        <option>Midfielder</option>
                        <option>Defender</option>
                        <option>Goalkeeper</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Age</label>
                      <input
                        type="number"
                        value={playerForm.age}
                        onChange={(e) => setPlayerForm({ ...playerForm, age: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Nationality</label>
                      <input
                        type="text"
                        placeholder="e.g. England"
                        value={playerForm.nationality}
                        onChange={(e) => setPlayerForm({ ...playerForm, nationality: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Metadata URI</label>
                      <input
                        type="text"
                        value={playerForm.metadataURI}
                        onChange={(e) => setPlayerForm({ ...playerForm, metadataURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm font-mono text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#111111] text-white disabled:bg-zinc-350 disabled:cursor-not-allowed font-extrabold text-sm tracking-wider uppercase py-4 transition-colors"
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
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Select Player profile</label>
                      <select
                        value={listForm.playerId}
                        onChange={(e) => setListForm({ ...listForm, playerId: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      >
                        {players.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (ID: #{p.id} - {p.currentClub})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Listing Price (USDC)</label>
                      <input
                        type="number"
                        value={listForm.price}
                        onChange={(e) => setListForm({ ...listForm, price: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Listing Metadata URI</label>
                      <input
                        type="text"
                        value={listForm.metadataURI}
                        onChange={(e) => setListForm({ ...listForm, metadataURI: e.target.value })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm font-mono text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#111111] text-white disabled:bg-zinc-350 disabled:cursor-not-allowed font-extrabold text-sm tracking-wider uppercase py-4 transition-colors"
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
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Target Listing</label>
                      <select
                        value={offerForm.listingId}
                        onChange={(e) => setOfferForm({ ...offerForm, listingId: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      >
                        {listings.filter(l => l.status === "Active").map((l) => (
                          <option key={l.id} value={l.id}>
                            Listing #{l.id} - {l.playerName} (Price: {l.price.toLocaleString()} USDC)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Offer Amount (USDC)</label>
                      <input
                        type="number"
                        value={offerForm.amount}
                        onChange={(e) => setOfferForm({ ...offerForm, amount: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="w-full bg-[#dd1515] hover:bg-[#111111] text-white disabled:bg-zinc-350 disabled:cursor-not-allowed font-extrabold text-sm tracking-wider uppercase py-4 transition-colors"
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
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Select Listing to Settle</label>
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
                        className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                      >
                        {listings.filter((l) => l.status === "Active").map((l) => (
                          <option key={l.id} value={l.id}>
                            Listing #{l.id} - {l.playerName} ({l.price.toLocaleString()} USDC)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Settlement Value (USDC)</label>
                      <input
                        type="text"
                        readOnly
                        value={escrowForm.amount.toLocaleString() + " USDC"}
                        className="w-full px-4 py-3 bg-zinc-100 border border-zinc-300 text-zinc-500 rounded text-sm font-extrabold focus:outline-none cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-500 uppercase font-black tracking-wider">Buyer Club Wallet</label>
                      <input
                        type="text"
                        readOnly
                        value={escrowForm.buyer}
                        className="w-full px-4 py-3 bg-zinc-100 border border-zinc-300 text-zinc-500 rounded text-sm font-mono focus:outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!walletConnected || listings.filter(l => l.status === "Active").length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-zinc-350 disabled:cursor-not-allowed font-extrabold text-sm tracking-wider uppercase py-4 transition-colors"
                  >
                    Execute: fundAndReleaseEscrow()
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* 8. Smart Contracts List Section (Totally Light Theme Cards) */}
      <section id="contracts" className="py-20 bg-[#f4f5f8] border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
            <span className="text-xs font-extrabold text-[#dd1515] tracking-widest uppercase">Ecosystem Contracts</span>
            <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tight">Smart Contract Repository</h2>
            <p className="text-sm text-zinc-500">
              Here is the modular structure of the smart contract architecture implemented in the <code className="text-zinc-700 bg-zinc-200 px-1 rounded">TransferChain-Contracts</code> directory.
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
              <div key={index} className="bg-white border border-zinc-200 p-6 space-y-4 hover:border-[#dd1515]/30 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-300 shadow-sm rounded-sm">
                <div className="w-10 h-10 bg-[#dd1515]/10 text-[#dd1515] font-mono font-black flex items-center justify-center border border-[#dd1515]/20 rounded-sm">
                  {`0${index + 1}`}
                </div>
                <h3 className="text-lg font-black text-zinc-950 uppercase tracking-tight">{contract.name}</h3>
                <p className="text-xs text-zinc-650 leading-relaxed">{contract.desc}</p>
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-[9px] text-zinc-400 uppercase font-black block">Key ABI Methods</span>
                  <code className="text-xs text-[#dd1515] font-mono block mt-1">{contract.methods}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
