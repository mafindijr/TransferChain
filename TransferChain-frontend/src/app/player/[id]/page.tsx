"use client";

import React, { useState, useEffect, use } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePublicClient, useAccount } from "wagmi";
import Link from "next/link";
import playerRegistryAbi from "@/abis/PlayerRegistry.json";

interface PlayerDetails {
  id: number;
  owner: string;
  name: string;
  metadataURI: string;
  position: string;
  age: number | null;
  nationality: string;
  imageURI: string;
  status: string;
  registeredAt: string;
  listing: {
    listingId: number;
    price: bigint;
    seller: string;
    status: number;
  } | null;
}

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const publicClient = usePublicClient();
  const { address: walletAddress, isConnected } = useAccount();
  
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Offer form state
  const [offerAmount, setOfferAmount] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const currentId = resolvedParams?.id ? Number(resolvedParams.id) : null;

  useEffect(() => {
    async function fetchPlayerDetails() {
      if (!publicClient || currentId === null) return;

      setPlayerId(currentId);

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Owner address from PlayerRegistry
        const ownerAddress = await publicClient.readContract({
          address: "0x49335199e4121fc332cb5b11ce704250dea92cc8",
          abi: playerRegistryAbi,
          functionName: "getPlayerOwner",
          args: [BigInt(currentId)]
        }) as string;

        if (!ownerAddress || ownerAddress === "0x0000000000000000000000000000000000000000") {
          setError("Player profile not found on-chain.");
          setPlayer(null);
          return;
        }

        // 2. Fetch Player struct from PlayerRegistry
        const onChainPlayer = await publicClient.readContract({
          address: "0x49335199e4121fc332cb5b11ce704250dea92cc8",
          abi: playerRegistryAbi,
          functionName: "getPlayer",
          args: [ownerAddress]
        }) as any;

        if (!onChainPlayer) {
          setError("Failed to resolve player profile variables.");
          return;
        }
        console.log("Player Data:", onChainPlayer);

        const name = onChainPlayer.name || "Unknown Player";
        const status = onChainPlayer.status === 0 ? "Active" : onChainPlayer.status === 1 ? "Suspended" : "Inactive";
        const metadataURI = onChainPlayer.metadataURI || "";
        const registeredAtTimestamp = Number(onChainPlayer.registeredAt || 0) * 1000;
        const registeredAt = registeredAtTimestamp > 0 
          ? new Date(registeredAtTimestamp).toISOString().replace("T", " ").substring(0, 16)
          : "N/A";
          console.log("d:" + metadataURI);
        // Resolve IPFS metadata by fetching the JSON directly from the metadataURI (NO mock presets fallback)
        let position = "N/A";
        let age: number | null = null;
        let nationality = "N/A";
        let imageURI = "/img/players/default icon.jpeg";

        if (metadataURI) {
          console.log("Resolved  Lorem ipsum dolor sit amet consectetur adipisicing elit. Incidunt eius earum deleniti vero laborum obcaecati laboriosam? Quidem incidunt optio consequuntur quia, magni vel consectetur officia reprehenderit adipisci? Sunt, nemo beatae", metadataURI);
          try {
            const fetchUrl = `https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${metadataURI.substring(7)}`;
            const response = await fetch(fetchUrl);

            if (!response.ok) {
              throw new Error(`Gateway returned status ${response.status}`);
            }

            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
              const metaData = await response.json();
              if (metaData) {
                  position = metaData.position || "N/A";
                  age = metaData.age ? Number(metaData.age) : null;
                  nationality = metaData.nationality || "N/A";
                  let rawImageURI = metaData.imageURI || "";
                  // If the metadata has an imageURI, use it. Otherwise, keep the default.
                  if (rawImageURI) imageURI = rawImageURI;
              }
            } else if (contentType && contentType.startsWith("image/")) {
              // The URI was a direct link to an image
              imageURI = fetchUrl;
            } else {
              console.warn(`Unexpected content type: ${contentType}`);
            }
          } catch (metaErr) {
            console.warn("Failed to fetch IPFS metadata JSON, searching local storage fallback:", metaErr);
          }
        }

        // Placeholder for listing details, as it's not fetched yet.
        const listingDetails = null;
        setPlayer({ 
          id: currentId,
          owner: ownerAddress,
          name,
          metadataURI,
          position,
          age,
          nationality,
          imageURI,
          status,
          registeredAt,
          listing: listingDetails
        });

      } catch (err: any) {
        console.error("Error loading player details:", err);
        setError("Failed to connect to RPC node or read player metadata.");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayerDetails();
  }, [publicClient, currentId]);

  

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Details View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="text-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-[#dd1515] animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-500 animate-pulse">Querying smart contract variables for Player ID #{playerId}...</p>
          </div>
        ) : error || !player ? (
          <div className="bg-white border border-zinc-200 text-center py-20 rounded-sm space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-zinc-800 uppercase">Profile Resolution Failed</h4>
              <p className="text-xs text-zinc-400 mt-1 px-4">
                {error || `No registered identity mapping found on-chain for Player ID #${playerId}.`}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link
                href="/marketplace"
                className="bg-zinc-900 hover:bg-[#dd1515] text-white text-xs font-extrabold px-6 py-3 transition-colors uppercase tracking-wider"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Breadcrumb */}
            <div className="text-xs text-zinc-500 flex items-center gap-2">
              <Link href="/" className="hover:text-[#dd1515]">HOME</Link>
              <span>/</span>
              <Link href="/marketplace" className="hover:text-[#dd1515]">MARKETPLACE</Link>
              <span>/</span>
              <span className="text-zinc-800 font-extrabold">PLAYER #{player.id}</span>
            </div>

            {/* Profile Row */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: Image Card */}
              <div className="bg-white border border-zinc-200 rounded-sm p-4 space-y-4">
                <div className="relative h-96 bg-zinc-100 overflow-hidden">
                  <img
                    src={player.imageURI}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-[#dd1515] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1">
                    {player.position}
                  </div>
                </div>
                
              </div>

              {/* Center Column: Core Registry Info */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Profile Header */}
                <div className="bg-[#111111] text-white p-8 border-b-4 border-[#dd1515] rounded-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-500 font-mono text-xs font-extrabold tracking-wider">PLAYER IDENTITY MATCHED</span>
                    <span className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded">
                      {player.status}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">{player.name}</h1>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[9px]">AGE</span>
                      <strong className="text-white text-sm">{player.age !== null ? `${player.age} Years` : "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[9px]">NATIONALITY</span>
                      <strong className="text-white text-sm">{player.nationality}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[9px]">REGISTRY ID</span>
                      <strong className="text-white text-sm">Player #{player.id}</strong>
                    </div>
                  </div>
                </div>

                

                {/* Marketplace Escrow / Offer Options */}
                <div className="bg-white border border-zinc-200 p-6 space-y-6">
                  <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider border-b border-zinc-100 pb-3">
                    Transfer Desk
                  </h3>

                  {player.listing ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                      <div className="space-y-1">
                        <span className="bg-red-500/10 text-[#dd1515] border border-red-500/20 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded block w-fit">
                          Listed For Sale
                        </span>
                        <p className="text-xs text-zinc-500">
                          Active listing found on TransferMarketplace.sol (Listing #{player.listing.listingId}).
                        </p>
                        <div className="pt-2">
                          <span className="text-[10px] text-zinc-400 block font-mono">LISTED PRICE</span>
                          <strong className="text-2xl font-black text-[#dd1515]">{Number(player.listing.price).toLocaleString()} USDC</strong>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <Link
                          href={`/#live-agreements`}
                          className="bg-[#dd1515] hover:bg-zinc-900 text-white font-extrabold text-xs uppercase px-8 py-4 transition-colors text-center tracking-wider rounded-sm"
                        >
                          Execute Instant Buy (Escrow)
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Listed status: <strong className="text-zinc-700">No active listings found</strong></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
                      </div>
                      
                      <div className="bg-zinc-50 border border-zinc-200 p-4 text-xs space-y-3">
                        <h4 className="font-extrabold text-zinc-800 uppercase text-[11px]">Make a Direct Transfer Offer</h4>
                        <p className="text-zinc-500">
                          Place a transfer bid directly to the player's identity owner. Bids will be processed by the TransferMarketplace smart contract.
                        </p>
                        <form className="flex gap-2">
                          <input
                            type="number"
                            required
                            placeholder="Offer Amount (USDC)"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 focus:outline-none w-full sm:max-w-xs"
                          />
                          <button
                            type="submit"
                            disabled={submittingOffer}
                            className="bg-zinc-900 hover:bg-[#dd1515] text-white px-5 font-extrabold text-[10px] uppercase tracking-wider transition-colors"
                          >
                            {submittingOffer ? "Placing Bid..." : "Submit Bid"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
