"use client";

import React, { useState, useEffect, use } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePublicClient, useAccount, useWriteContract } from "wagmi";
import Link from "next/link";
import playerRegistryAbi from "@/abis/PlayerRegistry.json";
import clubRegistryAbi from "@/abis/ClubRegistry.json";
import transferMarketplaceAbi from "@/abis/TransferMarketplace.json";
import { toast } from "react-toastify";

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

const PlayerRegistryAddress = process.env.NEXT_PUBLIC_PLAYER_REGISTRY || "0x49335199e4121fc332cb5b11ce704250dea92cc8";
const ClubRegistryAddress = process.env.NEXT_PUBLIC_CLUB_REGISTRY || "0x873ae71139407889650b74b24da51643a0e680eb";
const TransferMarketplaceAddress = process.env.NEXT_PUBLIC_TRANSFER_MARKET_PLACE || "0x6bc6dd2cc4f5c2c1ab6b0387ed95ec5b543eef1a";

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const publicClient = usePublicClient();
  const { address: walletAddress, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [offerAmount, setOfferAmount] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [submittingListing, setSubmittingListing] = useState(false);

  const currentId = resolvedParams?.id ? Number(resolvedParams.id) : null;

  const fetchPlayerDetails = async () => {
    if (!publicClient || currentId === null) return;

    setPlayerId(currentId);

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Owner address from PlayerRegistry
      const ownerAddress = await publicClient.readContract({
        address: PlayerRegistryAddress as `0x${string}`,
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
        address: PlayerRegistryAddress as `0x${string}`,
        abi: playerRegistryAbi,
        functionName: "getPlayer",
        args: [ownerAddress]
      }) as any;

      if (!onChainPlayer) {
        setError("Failed to resolve player profile variables.");
        return;
      }

      const name = onChainPlayer.name || "Unknown Player";
      const status = onChainPlayer.status === 0 ? "Active" : onChainPlayer.status === 1 ? "Suspended" : "Inactive";
      const metadataURI = onChainPlayer.metadataURI || "";
      const registeredAtTimestamp = Number(onChainPlayer.registeredAt || 0) * 1000;
      const registeredAt = registeredAtTimestamp > 0 
        ? new Date(registeredAtTimestamp).toISOString().replace("T", " ").substring(0, 16)
        : "N/A";

      // Resolve IPFS metadata
      let position = "N/A";
      let age: number | null = null;
      let nationality = "N/A";
      let imageURI = "/img/players/default icon.jpeg";

      if (metadataURI) {
        try {
          const cid = metadataURI.startsWith("ipfs://") ? metadataURI.substring(7) : metadataURI;
          const fetchUrl = `https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${cid}`;
          const response = await fetch(fetchUrl);

          if (response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const metaData = await response.json();
              if (metaData) {
                position = metaData.position || "N/A";
                age = metaData.age ? Number(metaData.age) : null;
                nationality = metaData.nationality || "N/A";
                if (metaData.imageURI) imageURI = metaData.imageURI;
              }
            } else if (contentType && contentType.startsWith("image/")) {
              imageURI = fetchUrl;
            }
          }
        } catch (metaErr) {
          console.warn("Failed to fetch IPFS metadata JSON:", metaErr);
        }
      }

      // 3. Fetch Listing details from TransferMarketplace contract
      let listingDetails = null;
      try {
        const nextLId = await publicClient.readContract({
          address: TransferMarketplaceAddress as `0x${string}`,
          abi: [
            {
              "type": "function",
              "name": "nextListingId",
              "inputs": [],
              "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
              "stateMutability": "view"
            }
          ],
          functionName: "nextListingId"
        }) as bigint;

        const totalListings = Number(nextLId) - 1;
        for (let i = 1; i <= totalListings; i++) {
          try {
            const listing = await publicClient.readContract({
              address: TransferMarketplaceAddress as `0x${string}`,
              abi: [
                {
                  "type": "function",
                  "name": "getListing",
                  "inputs": [{"name": "listingId_", "type": "uint256", "internalType": "uint256"}],
                  "outputs": [
                    {
                      "name": "",
                      "type": "tuple",
                      "internalType": "struct TransferMarketplace.Listing",
                      "components": [
                        {"name": "id", "type": "uint256", "internalType": "uint256"},
                        {"name": "seller", "type": "address", "internalType": "address"},
                        {"name": "playerId", "type": "uint256", "internalType": "uint256"},
                        {"name": "clubId", "type": "uint256", "internalType": "uint256"},
                        {"name": "price", "type": "uint256", "internalType": "uint256"},
                        {"name": "metadataURI", "type": "string", "internalType": "string"},
                        {"name": "status", "type": "uint8", "internalType": "uint8"},
                        {"name": "createdAt", "type": "uint256", "internalType": "uint256"}
                      ]
                    }
                  ],
                  "stateMutability": "view"
                }
              ],
              functionName: "getListing",
              args: [BigInt(i)]
            }) as any;

            if (listing && Number(listing.playerId) === currentId && Number(listing.status) === 0) { // Active = 0
              listingDetails = {
                listingId: Number(listing.id),
                price: BigInt(listing.price),
                seller: listing.seller,
                status: Number(listing.status)
              };
              break;
            }
          } catch (err) {
            console.error(`Error loading listing ${i}:`, err);
          }
        }
      } catch (err) {
        console.error("Error loading nextListingId:", err);
      }

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
  };

  useEffect(() => {
    fetchPlayerDetails();
  }, [publicClient, currentId]);

  // Create Listing smart contract call
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !publicClient || !player) return;

    try {
      setSubmittingListing(true);

      // Fetch the seller's club ID from ClubRegistry using getClub
      let clubId = BigInt(1);
      try {
        const sellerClub = await publicClient.readContract({
          address: ClubRegistryAddress as `0x${string}`,
          abi: clubRegistryAbi,
          functionName: "getClub",
          args: [walletAddress]
        }) as any;
        if (sellerClub && sellerClub.id) {
          clubId = BigInt(sellerClub.id);
        }
      } catch (clubErr) {
        console.warn("Could not retrieve owner club ID, defaulting to 1:", clubErr);
      }

      writeContract({
        abi: transferMarketplaceAbi,
        address: TransferMarketplaceAddress as `0x${string}`,
        functionName: "createListing",
        args: [
          walletAddress,
          BigInt(player.id),
          clubId,
          BigInt(listPrice),
          player.metadataURI || "ipfs://bafybeipplayer"
        ]
      }, {
        onSuccess: (txHash) => {
          toast.success(`Marketplace Listing created successfully!`);
          fetchPlayerDetails();
          setListPrice("");
          setSubmittingListing(false);
        },
        onError: (err) => {
          toast.error(`Transaction failed: ${err.message || err}`);
          setSubmittingListing(false);
        }
      });
    } catch (err: any) {
      console.error("Error listing player:", err);
      toast.error(`Error: ${err.message || err}`);
      setSubmittingListing(false);
    }
  };

  // Submit Offer smart contract call (makeOffer)
  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !player || !player.listing) return;

    try {
      setSubmittingOffer(true);

      writeContract({
        abi: transferMarketplaceAbi,
        address: TransferMarketplaceAddress as `0x${string}`,
        functionName: "makeOffer",
        args: [
          BigInt(player.listing.listingId),
          walletAddress,
          BigInt(offerAmount)
        ]
      }, {
        onSuccess: (txHash) => {
          toast.success(`Bid submitted successfully!`);
          fetchPlayerDetails();
          setOfferAmount("");
          setSubmittingOffer(false);
        },
        onError: (err) => {
          toast.error(`Transaction failed: ${err.message || err}`);
          setSubmittingOffer(false);
        }
      });
    } catch (err: any) {
      console.error("Error submitting offer:", err);
      toast.error(`Error: ${err.message || err}`);
      setSubmittingOffer(false);
    }
  };

  const isPlayerOwner = walletAddress && player && walletAddress.toLowerCase() === player.owner.toLowerCase();

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Details View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="text-center py-32 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-[#dd1515] animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-500 animate-pulse">Querying smart contract variables for Player ID #{currentId}...</p>
          </div>
        ) : error || !player ? (
          <div className="bg-white border border-zinc-200 text-center py-20 rounded-sm space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-zinc-800 uppercase">Profile Resolution Failed</h4>
              <p className="text-xs text-zinc-400 mt-1 px-4">
                {error || `No registered identity mapping found on-chain for Player ID #${currentId}.`}
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
            <div className="text-xs text-zinc-500 flex items-center gap-2 font-bold">
              <Link href="/" className="hover:text-[#dd1515]">HOME</Link>
              <span>/</span>
              <Link href="/marketplace" className="hover:text-[#dd1515]">MARKETPLACE</Link>
              <span>/</span>
              <span className="text-zinc-800 font-extrabold">PLAYER #{player.id}</span>
            </div>

            {/* Profile Row */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: Image Card */}
              <div className="bg-white border border-zinc-200 rounded-sm p-4 space-y-4 shadow-sm">
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

              {/* Center/Right Column: Core Registry & Market Actions */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Profile Header */}
                <div className="bg-[#111111] text-white p-8 border-b-4 border-[#dd1515] rounded-sm space-y-3 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-500 font-mono text-xs font-extrabold tracking-wider">PLAYER IDENTITY MATCHED</span>
                    <span className="bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded">
                      {player.status}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">{player.name}</h1>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-zinc-500 block uppercase text-[9px] font-extrabold">AGE</span>
                      <strong className="text-white text-sm font-bold">{player.age !== null ? `${player.age} Years` : "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[9px] font-extrabold">NATIONALITY</span>
                      <strong className="text-white text-sm font-bold">{player.nationality}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block uppercase text-[9px] font-extrabold">REGISTRY ID</span>
                      <strong className="text-white text-sm font-bold">Player #{player.id}</strong>
                    </div>
                  </div>
                </div>

               

                {/* Marketplace Escrow / Offer Options */}
                <div className="bg-white border border-zinc-200 p-6 space-y-6 shadow-sm">
                  <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider border-b border-zinc-150 pb-3">
                    Transfer Desk
                  </h3>

                  {player.listing ? (
                    /* CASE 1: ACTIVE MARKETPLACE LISTING IS DETECTED */
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                        <div className="space-y-1">
                          <span className="bg-red-500/10 text-[#dd1515] border border-red-500/25 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded block w-fit">
                            🔥 LISTED FOR SALE
                          </span>
                          <p className="text-xs text-zinc-500 pt-1.5">
                            Active listing found on TransferMarketplace (Listing #{player.listing.listingId}).
                          </p>
                          <div className="pt-2">
                            <span className="text-[10px] text-zinc-400 block font-mono font-bold">LISTED PRICE</span>
                            <strong className="text-2xl font-black text-[#dd1515]">{Number(player.listing.price).toLocaleString()} USDC</strong>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                          <Link
                            href={`/#live-agreements`}
                            className="bg-[#dd1515] hover:bg-zinc-950 text-white font-extrabold text-xs uppercase px-8 py-4 transition-colors text-center tracking-wider rounded-sm shadow-md shadow-[#dd1515]/20 hover:shadow-none"
                          >
                            Execute Instant Buy (Escrow)
                          </Link>
                        </div>
                      </div>

                      {/* Submitting offer for listed player */}
                      <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-sm text-xs space-y-3">
                        <h4 className="font-black text-zinc-800 uppercase text-[11px] tracking-wide">Place an Offer on this Listing</h4>
                        <p className="text-zinc-500">
                          Submit a custom bidding price to purchase this player's registration contract.
                        </p>
                        <form onSubmit={handleMakeOffer} className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                          <input
                            type="number"
                            required
                            placeholder="Bid Amount (USDC)"
                            value={offerAmount}
                            onChange={(e) => setOfferAmount(e.target.value)}
                            className="bg-white border border-zinc-300 text-xs px-4 py-3 text-zinc-800 focus:border-[#dd1515] focus:outline-none w-full sm:max-w-xs rounded-sm font-mono font-bold"
                          />
                          <button
                            type="submit"
                            disabled={submittingOffer}
                            className="bg-zinc-950 hover:bg-[#dd1515] text-white px-6 font-extrabold text-[10px] uppercase tracking-wider transition-colors rounded-sm shadow-sm"
                          >
                            {submittingOffer ? "Placing Bid..." : "Submit Bid"}
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    /* CASE 2: PLAYER IS NOT CURRENTLY LISTED ON THE MARKETPLACE */
                    <div className="space-y-6">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-bold">Marketplace Status: <strong className="text-zinc-700 font-black">Not Listed</strong></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-300 animate-pulse" />
                      </div>

                      {isPlayerOwner ? (
                        /* OWNER CLUB INTERFACE: SHOW FORM TO CREATE LISTING */
                        <div className="bg-[#dd1515]/5 border border-[#dd1515]/20 p-5 rounded-sm text-xs space-y-4">
                          <div className="space-y-1">
                            <h4 className="font-black text-[#dd1515] uppercase text-[11px] tracking-wide">List Player on Marketplace</h4>
                            <p className="text-zinc-500">
                              As the verified registrant club of this player identity, you can set a sale price and list them to the TransferMarketplace standard registry.
                            </p>
                          </div>
                          
                          <form onSubmit={handleCreateListing} className="flex flex-col sm:flex-row gap-2.5 items-stretch">
                            <input
                              type="number"
                              required
                              placeholder="Set Price (USDC)"
                              value={listPrice}
                              onChange={(e) => setListPrice(e.target.value)}
                              className="bg-white border border-zinc-300 text-xs px-4 py-3 text-zinc-800 focus:border-[#dd1515] focus:outline-none w-full sm:max-w-xs rounded-sm font-mono font-bold"
                            />
                            <button
                              type="submit"
                              disabled={submittingListing}
                              className="bg-[#dd1515] hover:bg-zinc-900 text-white px-6 font-extrabold text-[10px] uppercase tracking-wider transition-colors rounded-sm shadow-sm"
                            >
                              {submittingListing ? "Creating Listing..." : "List Player"}
                            </button>
                          </form>
                        </div>
                      ) : (
                        /* NON-OWNER INTERFACE: SHOW EXPLANATION */
                        <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-sm text-xs text-zinc-500">
                          This player is currently not listed for sale on the TransferMarketplace. Bidding on listings is disabled until the registrant owner club places the player on the market.
                        </div>
                      )}
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
