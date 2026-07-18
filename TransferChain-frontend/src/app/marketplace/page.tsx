"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePublicClient, useAccount } from "wagmi";
import Link from "next/link";
import playerRegistryAbi from "@/abis/PlayerRegistry.json";

interface PlayerListing {
  id: number;
  owner: string;
  name: string;
  metadataURI: string;
  position: string;
  age: number;
  nationality: string;
  imageURI: string;
  status: string;
  txHash: string;
  blockNumber: number;
  listing: {
    listingId: number;
    price: bigint;
    seller: string;
  } | null;
}

export default function Marketplace() {
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();
  const [players, setPlayers] = useState<PlayerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPosition, setFilterPosition] = useState("All");

  const loadLocalStoragePlayers = () => {
    if (typeof window !== "undefined") {
      const storedPlayers = localStorage.getItem("tc_players");
      if (storedPlayers) {
        const localPlayers = JSON.parse(storedPlayers);
        
        // Fetch listings from local storage as well to see if any are listed for sale
        const storedListings = localStorage.getItem("tc_listings");
        const currentListings = storedListings ? JSON.parse(storedListings) : [];
        const listingsMap = new Map(currentListings.map((l: any) => [Number(l.playerId), l]));

        const mappedLocal = localPlayers.map((p: any) => {
          const listing = listingsMap.get(Number(p.id));
          
          // Presets for graphics
          let imageURI = p.imageURI || `/img/soccer/soccer-${(p.id % 4) + 1}.jpg`;
          const cleanName = (p.name || "").toLowerCase();
          if (cleanName.includes("mbapp")) imageURI = "/img/players/Mbappe.jpg";
          else if (cleanName.includes("haaland")) imageURI = "/img/players/Haaland.png";
          else if (cleanName.includes("bellingham")) imageURI = "/img/players/Jude.png";
          else if (cleanName.includes("musiala")) imageURI = "/img/players/Musiala.jpg";

          return {
            id: p.id,
            owner: p.owner,
            name: p.name,
            metadataURI: p.metadataURI,
            position: p.position || "Forward",
            age: p.age || 22,
            nationality: p.nationality || "Injective",
            imageURI: imageURI,
            status: p.status || "Active",
            txHash: p.txHash || "0x" + Math.random().toString(16).substring(2, 8) + "..." + Math.random().toString(16).substring(2, 6),
            blockNumber: p.blockNumber || 1550231,
            listing: listing ? {
              listingId: listing.id,
              price: BigInt(listing.price),
              seller: listing.seller
            } : null
          };
        });
        setPlayers(mappedLocal);
      } else {
        setPlayers([]);
      }
    }
  };

  useEffect(() => {
    async function scrapeEventLogs() {
      if (!publicClient) {
        loadLocalStoragePlayers();
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1. Scrape PlayerRegistered logs from PlayerRegistry contract
        const playerLogs = await publicClient.getLogs({
          address: "0x49335199e4121fc332cb5b11ce704250dea92cc8",
          event: {
            type: "event",
            name: "PlayerRegistered",
            inputs: [
              { indexed: true, name: "owner", type: "address" },
              { indexed: true, name: "playerId", type: "uint256" },
              { indexed: false, name: "metadataURI", type: "string" }
            ]
          },
          fromBlock: 0n
        });

        if (playerLogs.length === 0) {
          loadLocalStoragePlayers();
          return;
        }

        // 2. Scrape ListingCreated logs from TransferMarketplace contract
        const listingLogs = await publicClient.getLogs({
          address: "0x6bc6dd2cc4f5c2c1ab6b0387ed95ec5b543eef1a",
          event: {
            type: "event",
            name: "ListingCreated",
            inputs: [
              { indexed: true, name: "listingId", type: "uint256" },
              { indexed: true, name: "seller", type: "address" },
              { indexed: true, name: "playerId", type: "uint256" },
              { indexed: false, name: "price", type: "uint256" }
            ]
          },
          fromBlock: 0n
        });

        // Map listings by Player ID for easy cross-referencing
        const activeListings = new Map<number, { listingId: number; price: bigint; seller: string }>();
        listingLogs.forEach(log => {
          if (log.args && log.args.playerId) {
            const pId = Number(log.args.playerId);
            const price = log.args.price ? BigInt(log.args.price) : 0n;
            activeListings.set(pId, {
              listingId: Number(log.args.listingId),
              price,
              seller: log.args.seller || ""
            });
          }
        });

        // 3. For each player log, fetch live state using getPlayer read call
        const parsedPlayers = await Promise.all(
          playerLogs.map(async (log) => {
            const ownerAddress = log.args.owner || "0x0";
            const playerId = Number(log.args.playerId);
            const metadataURI = log.args.metadataURI || "";

            let name = "Unknown Player";
            let status = "Active";

            try {
              const onChainPlayer = await publicClient.readContract({
                address: "0x49335199e4121fc332cb5b11ce704250dea92cc8",
                abi: playerRegistryAbi,
                functionName: "getPlayer",
                args: [ownerAddress]
              }) as any;

              if (onChainPlayer) {
                name = onChainPlayer.name || "Unknown Player";
                status = onChainPlayer.status === 0 ? "Active" : onChainPlayer.status === 1 ? "Suspended" : "Inactive";
              }
            } catch (e) {
              console.error("Error reading on-chain player details:", e);
            }

            // Parse metadata values (mocked client-side attributes based on metadata hash)
            let position = "Forward";
            let age = 22;
            let nationality = "Injective";
            let imageURI = `/img/soccer/soccer-${(playerId % 4) + 1}.jpg`;

            // Standard preset mapping for beautiful mock data if named correctly
            const cleanName = name.toLowerCase();
            if (cleanName.includes("mbapp")) {
              position = "Forward";
              age = 27;
              nationality = "France";
              imageURI = "/img/players/Mbappe.jpg";
            } else if (cleanName.includes("haaland")) {
              position = "Striker";
              age = 25;
              nationality = "Norway";
              imageURI = "/img/players/Haaland.png";
            } else if (cleanName.includes("bellingham")) {
              position = "Midfielder";
              age = 23;
              nationality = "England";
              imageURI = "/img/players/Jude.png";
            } else if (cleanName.includes("musiala")) {
              position = "Playmaker";
              age = 23;
              nationality = "Germany";
              imageURI = "/img/players/Musiala.jpg";
            } else if (cleanName.includes("saka")) {
              position = "Winger";
              age = 24;
              nationality = "England";
              imageURI = "/img/soccer/soccer-1.jpg";
            }

            const listing = activeListings.get(playerId);

            return {
              id: playerId,
              owner: ownerAddress,
              name,
              metadataURI,
              position,
              age,
              nationality,
              imageURI,
              status,
              txHash: log.transactionHash,
              blockNumber: Number(log.blockNumber),
              listing: listing || null
            };
          })
        );

        setPlayers(parsedPlayers);
      } catch (err) {
        console.error("Error fetching logs:", err);
        loadLocalStoragePlayers();
      } finally {
        setLoading(false);
      }
    }

    scrapeEventLogs();
  }, [publicClient]);

  const filteredPlayers = players.filter((p) => {
    if (filterPosition === "All") return true;
    return p.position === filterPosition;
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
      {/* Global Header */}
      <Header />

      {/* Hero Banner (Clean Dark Theme) */}
      <div className="bg-[#111111] text-white py-16 border-b border-[#dd1515]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-amber-500 font-extrabold text-[10px] uppercase tracking-widest bg-amber-500/10 px-3 py-1 border border-amber-500/20 rounded">
                📊 ON-CHAIN EVENTS SCRAPING
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                TransferChain <span className="text-[#dd1515]">Marketplace</span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-xl">
                This page directly queries Injective EVM Testnet event logs (<code className="text-zinc-300 font-mono">PlayerRegistered</code> and <code className="text-zinc-300 font-mono">ListingCreated</code>) and displays players registered in the smart contract registry.
              </p>
            </div>
            <Link
              href="/register-player"
              className="bg-[#dd1515] hover:bg-white hover:text-black text-white font-extrabold text-xs uppercase px-6 py-3.5 transition-colors tracking-wider"
            >
              + Register New Player
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Filters and State */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 pb-6 mb-10">
          <div>
            <h2 className="text-2xl font-black text-zinc-950 uppercase tracking-tight">
              Registered Profiles ({filteredPlayers.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Currently connected: <strong className="text-zinc-700">{isConnected ? "Yes (MetaMask)" : "No (Local/Simulated)"}</strong>
            </p>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Filter:</span>
            <div className="flex bg-[#f1f3f6] p-1 rounded-sm gap-1 text-[11px] font-extrabold uppercase">
              {["All", "Forward", "Striker", "Midfielder", "Playmaker", "Winger", "Defender", "Goalkeeper"].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilterPosition(pos)}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
                    filterPosition === pos
                      ? "bg-[#dd1515] text-white shadow"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading and empty states */}
        {loading ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-[#dd1515] animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-500 animate-pulse">Scraping Injective EVM event logs from block 0...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="bg-white border border-zinc-200 text-center py-20 rounded-sm space-y-4">
            <div className="w-12 h-12 bg-zinc-100 text-zinc-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-zinc-800 uppercase">No Registered Players Found</h4>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                No events of type <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-700">PlayerRegistered</code> were found matching this query.
              </p>
            </div>
            <Link
              href="/register-player"
              className="inline-block bg-[#dd1515] hover:bg-[#111111] text-white text-xs font-extrabold px-6 py-3 transition-colors uppercase tracking-wider"
            >
              Onboard First Player
            </Link>
          </div>
        ) : (
          /* Grid list of Players */
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="bg-white border border-zinc-200 overflow-hidden group shadow-md hover:shadow-2xl hover:border-[#dd1515]/30 hover:-translate-y-2.5 transition-all duration-500 ease-out rounded-sm"
              >
                
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
                    <span className="text-[10px] text-zinc-400 block font-mono truncate">OWNER: {player.owner}</span>
                  </div>
                </div>

                {/* Content (Specer Card layout) */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-zinc-950 uppercase tracking-tight truncate">{player.name}</h3>
                    <div className="flex justify-between items-center mt-2 text-xs text-zinc-500">
                      <span>Age: <strong className="text-zinc-700 font-bold">{player.age} Years</strong></span>
                      <span>Nationality: <strong className="text-zinc-700 font-bold">{player.nationality}</strong></span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-3 space-y-2 text-[10px] font-mono text-zinc-400">
                    <div className="flex justify-between">
                      <span>STATUS:</span>
                      <span className="text-emerald-600 font-bold">{player.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>BLOCK:</span>
                      <span>#{player.blockNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TX HASH:</span>
                      <span className="text-zinc-500 font-bold">{player.txHash.substring(0, 8)}...</span>
                    </div>
                  </div>

                  {player.listing ? (
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] text-zinc-400 block uppercase">Price</span>
                        <strong className="text-sm font-black text-[#dd1515]">{Number(player.listing.price).toLocaleString()} USDC</strong>
                      </div>
                      <Link
                        href={`/#live-agreements`}
                        className="bg-[#dd1515] hover:bg-zinc-900 text-white font-extrabold text-[9px] uppercase px-3 py-2 transition-colors"
                      >
                        Buy Player
                      </Link>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-zinc-400 text-xs">
                      <span>Not Listed</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
