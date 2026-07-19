"use client";

import React, { useState, useEffect, use } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePublicClient, useAccount, useWriteContract } from "wagmi";
import Link from "next/link";
import playerRegistryAbi from "@/abis/PlayerRegistry.json";
import clubRegistryAbi from "@/abis/ClubRegistry.json";
import transferMarketplaceAbi from "@/abis/TransferMarketplace.json";
import transferAgreementManagerAbi from "@/abis/TransferAgreementManager.json";
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

interface ClauseSet {
  transferFee: bigint;
  signingBonus: bigint;
  sellOnPercentage: bigint;
  releaseClause: bigint;
  installmentAmount: bigint;
  appearanceBonus: bigint;
  goalBonus: bigint;
  metadataURI: string;
}

interface Agreement {
  id: number;
  listingId: number;
  buyer: string;
  seller: string;
  status: number;
  clauses: ClauseSet;
  buyerSigned: boolean;
  sellerSigned: boolean;
  createdAt: number;
}

const PlayerRegistryAddress = process.env.NEXT_PUBLIC_PLAYER_REGISTRY || "0x49335199e4121fc332cb5b11ce704250dea92cc8";
const ClubRegistryAddress = process.env.NEXT_PUBLIC_CLUB_REGISTRY || "0x873ae71139407889650b74b24da51643a0e680eb";
const TransferMarketplaceAddress = process.env.NEXT_PUBLIC_TRANSFER_MARKET_PLACE || "0x6bc6dd2cc4f5c2c1ab6b0387ed95ec5b543eef1a";
const TransferAgreementManagerAddress = process.env.NEXT_PUBLIC_TRANSFER_AGREEMENT_MANAGER || "0x4e9865d82174376b1246e982311d85b8cc1297f8";

export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const publicClient = usePublicClient();
  const { address: walletAddress, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [player, setPlayer] = useState<PlayerDetails | null>(null);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [offerAmount, setOfferAmount] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [submittingListing, setSubmittingListing] = useState(false);

  // Agreement Clause form states
  const [transferFee, setTransferFee] = useState("");
  const [signingBonus, setSigningBonus] = useState("0");
  const [sellOnPercentage, setSellOnPercentage] = useState("0");
  const [releaseClause, setReleaseClause] = useState("0");
  const [installmentAmount, setInstallmentAmount] = useState("0");
  const [appearanceBonus, setAppearanceBonus] = useState("0");
  const [goalBonus, setGoalBonus] = useState("0");
  const [creatingAgreement, setCreatingAgreement] = useState(false);

  const [approvingAgreementId, setApprovingAgreementId] = useState<number | null>(null);
  const [rejectingAgreementId, setRejectingAgreementId] = useState<number | null>(null);

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
              setTransferFee(listing.price.toString());
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

      // 4. Fetch Agreements from TransferAgreementManager contract
      const fetchedAgreements: Agreement[] = [];
      if (listingDetails) {
        try {
          const nextAgId = await publicClient.readContract({
            address: TransferAgreementManagerAddress as `0x${string}`,
            abi: [
              {
                "type": "function",
                "name": "nextAgreementId",
                "inputs": [],
                "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
                "stateMutability": "view"
              }
            ],
            functionName: "nextAgreementId"
          }) as bigint;

          const totalAgreements = Number(nextAgId) - 1;
          for (let i = 1; i <= totalAgreements; i++) {
            try {
              const agreement = await publicClient.readContract({
                address: TransferAgreementManagerAddress as `0x${string}`,
                abi: transferAgreementManagerAbi,
                functionName: "getAgreement",
                args: [BigInt(i)]
              }) as any;

              if (agreement && Number(agreement.listingId) === Number(listingDetails.listingId)) {
                fetchedAgreements.push({
                  id: Number(agreement.id),
                  listingId: Number(agreement.listingId),
                  buyer: agreement.buyer,
                  seller: agreement.seller,
                  status: Number(agreement.status),
                  clauses: {
                    transferFee: BigInt(agreement.clauses.transferFee),
                    signingBonus: BigInt(agreement.clauses.signingBonus),
                    sellOnPercentage: BigInt(agreement.clauses.sellOnPercentage),
                    releaseClause: BigInt(agreement.clauses.releaseClause),
                    installmentAmount: BigInt(agreement.clauses.installmentAmount),
                    appearanceBonus: BigInt(agreement.clauses.appearanceBonus),
                    goalBonus: BigInt(agreement.clauses.goalBonus),
                    metadataURI: agreement.clauses.metadataURI
                  },
                  buyerSigned: agreement.buyerSigned,
                  sellerSigned: agreement.sellerSigned,
                  createdAt: Number(agreement.createdAt)
                });
              }
            } catch (agErr) {
              console.error(`Error loading agreement ${i}:`, agErr);
            }
          }
        } catch (err) {
          console.error("Error loading nextAgreementId:", err);
        }
      }
      setAgreements(fetchedAgreements);

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

  // Create Agreement Draft (createAgreement)
  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !player || !player.listing) return;

    try {
      setCreatingAgreement(true);

      writeContract({
        abi: transferAgreementManagerAbi,
        address: TransferAgreementManagerAddress as `0x${string}`,
        functionName: "createAgreement",
        args: [
          BigInt(player.listing.listingId),
          walletAddress,
          player.owner,
          BigInt(transferFee),
          BigInt(signingBonus),
          BigInt(sellOnPercentage),
          BigInt(releaseClause),
          BigInt(installmentAmount),
          BigInt(appearanceBonus),
          BigInt(goalBonus),
          player.metadataURI || "ipfs://bafybeipplayer"
        ]
      }, {
        onSuccess: (txHash) => {
          toast.success(`Agreement Draft initialized!`);
          fetchPlayerDetails();
          setCreatingAgreement(false);
        },
        onError: (err) => {
          toast.error(`Agreement Draft failed: ${err.message || err}`);
          setCreatingAgreement(false);
        }
      });
    } catch (err: any) {
      console.error("Error creating agreement:", err);
      toast.error(`Error: ${err.message || err}`);
      setCreatingAgreement(false);
    }
  };

  // Approve Agreement (approveAgreement)
  const handleApproveAgreement = async (agreementId: number) => {
    if (!walletAddress) return;

    try {
      setApprovingAgreementId(agreementId);

      writeContract({
        abi: transferAgreementManagerAbi,
        address: TransferAgreementManagerAddress as `0x${string}`,
        functionName: "approveAgreement",
        args: [BigInt(agreementId)]
      }, {
        onSuccess: (txHash) => {
          toast.success(`Agreement Approved successfully! `);
          fetchPlayerDetails();
          setApprovingAgreementId(null);
        },
        onError: (err) => {
          toast.error(`Approval failed: ${err.message || err}`);
          setApprovingAgreementId(null);
        }
      });
    } catch (err: any) {
      console.error("Error approving agreement:", err);
      toast.error(`Error: ${err.message || err}`);
      setApprovingAgreementId(null);
    }
  };

  // Reject Agreement (rejectAgreement)
  const handleRejectAgreement = async (agreementId: number) => {
    if (!walletAddress) return;

    try {
      setRejectingAgreementId(agreementId);

      writeContract({
        abi: transferAgreementManagerAbi,
        address: TransferAgreementManagerAddress as `0x${string}`,
        functionName: "rejectAgreement",
        args: [BigInt(agreementId)]
      }, {
        onSuccess: (txHash) => {
          toast.success(`Agreement Rejected!`);
          fetchPlayerDetails();
          setRejectingAgreementId(null);
        },
        onError: (err) => {
          toast.error(`Rejection failed: ${err.message || err}`);
          setRejectingAgreementId(null);
        }
      });
    } catch (err: any) {
      console.error("Error rejecting agreement:", err);
      toast.error(`Error: ${err.message || err}`);
      setRejectingAgreementId(null);
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

                {/* Identity Ownership Information */}
                <div className="bg-white border border-zinc-200 p-6 space-y-3 shadow-sm text-xs">
                  <span className="text-zinc-400 font-extrabold uppercase text-[9px] tracking-wider block">Registrant Club Address</span>
                  <div className="font-mono text-zinc-800 bg-zinc-50 border border-zinc-200 px-4 py-2.5 rounded break-all select-all font-bold">
                    {player.owner}
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
                      </div>

                      {/* Submitting offer / bid for listed player */}
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
                            className="bg-zinc-900 hover:bg-[#dd1515] text-white px-6 font-extrabold text-[10px] uppercase tracking-wider transition-colors rounded-sm shadow-sm"
                          >
                            {submittingOffer ? "Placing Bid..." : "Submit Bid"}
                          </button>
                        </form>
                      </div>

                      {/* NEGOTIATION AND TRANSFER AGREEMENTS (createAgreement) */}
                      {!isPlayerOwner && (
                        <div className="bg-white border border-zinc-200 p-5 rounded-sm text-xs space-y-4">
                          <div className="space-y-1">
                            <h4 className="font-black text-[#dd1515] uppercase text-[11px] tracking-wide">Initialize Transfer Agreement Clauses</h4>
                            <p className="text-zinc-500">
                              Define the custom commercial clauses for this transfer. Submitting initialized clauses will deploy a draft agreement to the `TransferAgreementManager` contract.
                            </p>
                          </div>

                          <form onSubmit={handleCreateAgreement} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            <div>
                              <label className="text-zinc-400 block font-bold text-[9px] uppercase pb-1">Transfer Fee (USDC)</label>
                              <input
                                type="number"
                                required
                                value={transferFee}
                                onChange={(e) => setTransferFee(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-400 block font-bold text-[9px] uppercase pb-1">Signing Bonus (USDC)</label>
                              <input
                                type="number"
                                required
                                value={signingBonus}
                                onChange={(e) => setSigningBonus(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-400 block font-bold text-[9px] uppercase pb-1">Sell-On Clause (%)</label>
                              <input
                                type="number"
                                required
                                value={sellOnPercentage}
                                onChange={(e) => setSellOnPercentage(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-400 block font-bold text-[9px] uppercase pb-1">Release Clause (USDC)</label>
                              <input
                                type="number"
                                required
                                value={releaseClause}
                                onChange={(e) => setReleaseClause(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-400 block font-bold text-[9px] uppercase pb-1">Installment Amount (USDC)</label>
                              <input
                                type="number"
                                required
                                value={installmentAmount}
                                onChange={(e) => setInstallmentAmount(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-400 block font-bold text-[9px] uppercase pb-1">Appearance Bonus (USDC)</label>
                              <input
                                type="number"
                                required
                                value={appearanceBonus}
                                onChange={(e) => setAppearanceBonus(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-zinc-400 block font-bold text-[9px] uppercase pb-1">Goal Bonus (USDC)</label>
                              <input
                                type="number"
                                required
                                value={goalBonus}
                                onChange={(e) => setGoalBonus(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2 pt-2">
                              <button
                                type="submit"
                                disabled={creatingAgreement}
                                className="bg-[#dd1515] hover:bg-zinc-900 text-white font-extrabold text-[10px] uppercase tracking-wider py-3 px-6 rounded-sm w-full transition-colors"
                              >
                                {creatingAgreement ? "Initializing Draft Agreement..." : "Initialize Transfer Agreement (Draft)"}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* DETECTED ACTIVE AGREEMENTS ON-CHAIN (getAgreement + approve/reject) */}
                      {agreements.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-zinc-150">
                          <h4 className="font-extrabold text-xs text-zinc-950 uppercase tracking-wider">
                            Active Agreements on Listing
                          </h4>

                          <div className="space-y-4">
                            {agreements.map((agreement) => {
                              const isBuyer = walletAddress && walletAddress.toLowerCase() === agreement.buyer.toLowerCase();
                              
                              const statusLabel = 
                                agreement.status === 0 ? "Draft" :
                                agreement.status === 1 ? "Approved" :
                                agreement.status === 2 ? "Rejected" :
                                agreement.status === 3 ? "Expired" : "Signed";

                              const statusBadge = 
                                agreement.status === 0 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                agreement.status === 1 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                agreement.status === 2 ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                agreement.status === 3 ? "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20" :
                                "bg-blue-500/10 text-blue-500 border border-blue-500/20";

                              return (
                                <div key={agreement.id} className="bg-zinc-50 border border-zinc-200 p-5 rounded-sm space-y-4 text-xs shadow-sm">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div>
                                      <span className="font-mono text-zinc-400 text-[10px] block">AGREEMENT ID</span>
                                      <strong className="text-zinc-800 font-extrabold">Agreement ID #{agreement.id}</strong>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded ${statusBadge}`}>
                                        {statusLabel}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] border-t border-b border-zinc-150 py-3 font-medium">
                                    <div>
                                      <span className="text-zinc-400 block uppercase text-[8px]">Fee</span>
                                      <strong className="text-zinc-700 font-bold">{Number(agreement.clauses.transferFee).toLocaleString()} USDC</strong>
                                    </div>
                                    <div>
                                      <span className="text-zinc-400 block uppercase text-[8px]">Bonus</span>
                                      <strong className="text-zinc-700 font-bold">{Number(agreement.clauses.signingBonus).toLocaleString()} USDC</strong>
                                    </div>
                                    <div>
                                      <span className="text-zinc-400 block uppercase text-[8px]">Sell-On</span>
                                      <strong className="text-zinc-700 font-bold">{Number(agreement.clauses.sellOnPercentage)}%</strong>
                                    </div>
                                    <div>
                                      <span className="text-zinc-400 block uppercase text-[8px]">Release</span>
                                      <strong className="text-zinc-700 font-bold">{Number(agreement.clauses.releaseClause).toLocaleString()} USDC</strong>
                                    </div>
                                  </div>

                                  

                                  {/* Action Buttons for Buyer if agreement is in Draft status */}
                                  {isBuyer && agreement.status === 0 && (
                                    <div className="flex gap-2 pt-2">
                                      <button
                                        onClick={() => handleApproveAgreement(agreement.id)}
                                        disabled={approvingAgreementId === agreement.id}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-sm transition-colors"
                                      >
                                        {approvingAgreementId === agreement.id ? "Approving..." : "Approve Agreement"}
                                      </button>
                                      <button
                                        onClick={() => handleRejectAgreement(agreement.id)}
                                        disabled={rejectingAgreementId === agreement.id}
                                        className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-sm transition-colors"
                                      >
                                        {rejectingAgreementId === agreement.id ? "Rejecting..." : "Reject Agreement"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
                          This player is currently not listed for sale on the TransferMarketplace. Agreements can only be created once the player is listed.
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
