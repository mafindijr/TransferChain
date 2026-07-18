"use client";

import React, { useState, useEffect, use } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePublicClient, useAccount } from "wagmi";
import Link from "next/link";
import clubRegistryAbi from "@/abis/ClubRegistry.json";
import playerRegistryAbi from "@/abis/PlayerRegistry.json";

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
  status: string;
  registeredAt: string;
}

interface Player {
  id: number;
  owner: string;
  name: string;
  position: string;
  age: number;
  nationality: string;
  imageURI: string;
  status: string;
}

const ClubRegistryAddress = process.env.NEXT_PUBLIC_CLUB_REGISTRY;
const PlayerRegistryAddress = process.env.NEXT_PUBLIC_PLAYER_REGISTRY;



export default function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();

  const [club, setClub] = useState<Club | null>(null);
  const [squad, setSquad] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentId = resolvedParams?.id ? Number(resolvedParams.id) : null;

  useEffect(() => {
    async function fetchClubAndSquad() {
      if (currentId === null) return;

      try {
        setLoading(true);
        setError(null);

        let resolvedClub: Club | null = null;
        let resolvedSquad: Player[] = [];

        // 1. Attempt to fetch details from blockchain if connected
        if (publicClient) {
          try {
            const ownerAddress = await publicClient.readContract({
              address: ClubRegistryAddress as `0x${string}`,
              abi: clubRegistryAbi,
              functionName: "getClubOwner",
              args: [BigInt(currentId)]
            }) as string;

            if (ownerAddress && ownerAddress !== "0x0000000000000000000000000000000000000000") {
              const onChainClub = await publicClient.readContract({
                address: ClubRegistryAddress as `0x${string}`,
                abi: clubRegistryAbi,
                functionName: "getClub",
                args: [ownerAddress]
              }) as any;

              if (onChainClub) {
                const name = onChainClub.name || "Unknown Club";
                const country = onChainClub.country || "";
                const city = onChainClub.city || "";
                const league = onChainClub.league || "";
                let logoURI = onChainClub.logoURI || `/img/match/tf-${(currentId % 5) + 1}.jpg`;
                const website = onChainClub.website || "";
                const status = onChainClub.status === 0 ? "Verified" : onChainClub.status === 1 ? "Suspended" : "Pending";
                const metadataURI = onChainClub.metadataURI || "";

                if (logoURI.startsWith("ipfs://")) {
                  const cid = logoURI.replace("ipfs://", "");
                  logoURI = `https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${cid}`;
                }

                resolvedClub = {
                  id: currentId,
                  owner: ownerAddress,
                  name,
                  metadataURI,
                  country,
                  city,
                  league,
                  logoURI,
                  website,
                  status,
                  registeredAt: onChainClub.registeredAt
                    ? new Date(Number(onChainClub.registeredAt) * 1000).toISOString().replace("T", " ").substring(0, 16)
                    : new Date().toISOString().replace("T", " ").substring(0, 16),
                };
              }
            }
          } catch (contractErr) {
            console.warn("Smart contract query failed, using mock fallback:", contractErr);
          }
        }

        

        if (!resolvedClub) {
          setError("Club profile not found in database.");
          setLoading(false);
          return;
        }

        setClub(resolvedClub);

        // 3. Fetch Squad (Players registered under this club's owner address)
        if (publicClient) {
          try {
            const nextPlayerId = await publicClient.readContract({
              address: PlayerRegistryAddress as `0x${string}`,
              abi: playerRegistryAbi,
              functionName: "nextPlayerId"
            }) as bigint;

            const totalPlayers = Number(nextPlayerId) - 1;
            const clubOwnerLower = resolvedClub.owner.toLowerCase();

            for (let i = 1; i <= totalPlayers; i++) {
              try {
                const playerOwner = await publicClient.readContract({
                  address: PlayerRegistryAddress as `0x${string}`,
                  abi: playerRegistryAbi,
                  functionName: "getPlayerOwner",
                  args: [BigInt(i)]
                }) as string;

                if (playerOwner.toLowerCase() === clubOwnerLower) {
                  const onChainPlayer = await publicClient.readContract({
                    address: PlayerRegistryAddress as `0x${string}`,
                    abi: playerRegistryAbi,
                    functionName: "getPlayer",
                    args: [playerOwner]
                  }) as any;

                  if (onChainPlayer) {
                    const name = onChainPlayer.name || "Unknown Player";
                    const status = onChainPlayer.status === 0 ? "Active" : onChainPlayer.status === 1 ? "Suspended" : "Inactive";
                    const metadataURI = onChainPlayer.metadataURI || "";

                    let position = "N/A";
                    let age = 22;
                    let nationality = "N/A";
                    let imageURI = `/img/soccer/soccer-${(i % 4) + 1}.jpg`;

                    // Attempt metadata resolution
                    if (metadataURI && metadataURI.startsWith("ipfs://")) {
                      try {
                        const cid = metadataURI.replace("ipfs://", "");
                        const metaRes = await fetch(`https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${cid}`);
                        if (metaRes.ok) {
                          const metaData = await metaRes.json();
                          if (metaData) {
                            position = metaData.position || "N/A";
                            age = metaData.age ? Number(metaData.age) : 22;
                            nationality = metaData.nationality || "N/A";
                            if (metaData.imageURI) imageURI = metaData.imageURI;
                          }
                        }
                      } catch (metaErr) {
                        console.warn(`Failed metadata fetch for player ID ${i}:`, metaErr);
                      }
                    }

                    resolvedSquad.push({
                      id: i,
                      owner: playerOwner,
                      name,
                      position,
                      age,
                      nationality,
                      imageURI,
                      status,
                    });
                  }
                }
              } catch (playerErr) {
                console.error(`Error fetching squad player ID ${i}:`, playerErr);
              }
            }
          } catch (contractSquadErr) {
            console.warn("Failed fetching contract squad:", contractSquadErr);
          }
        }

       

        setSquad(resolvedSquad);

      } catch (err: any) {
        console.error("General error loading details page:", err);
        setError("An unexpected error occurred while resolving registry data.");
      } finally {
        setLoading(false);
      }
    }

    fetchClubAndSquad();
  }, [publicClient, currentId]);

  // Fallback for missing badge image
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (club) {
      e.currentTarget.src = `/img/match/tf-${(club.id % 5) + 1}.jpg`;
    }
  };

  // 1. EARLY RETURN FOR LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
        <Header />
        <div className="bg-[#111111] text-white py-16 border-b border-[#dd1515]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Loading <span className="text-[#dd1515]">Profile</span>
            </h1>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#dd1515] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Resolving Registry Details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 2. EARLY RETURN FOR ERROR OR NOT FOUND
  if (error || !club) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
        <Header />
        <div className="bg-[#111111] text-white py-16 border-b border-[#dd1515]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Profile <span className="text-[#dd1515]">Error</span>
            </h1>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white border border-zinc-200 rounded p-16 text-center max-w-md mx-auto shadow-md">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 uppercase">Profile Error</h3>
            <p className="text-xs text-zinc-500 mt-2 mb-6">
              {error || "Club details could not be found."}
            </p>
            <Link
              href="/clubs"
              className="bg-zinc-900 hover:bg-[#dd1515] text-white text-xs font-extrabold px-6 py-2.5 transition-colors uppercase tracking-wider"
            >
              Return to Directory
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 3. FLAT RENDERING FOR VERIFIED PROFILE (SUCCESS)
  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
      {/* Header */}
      <Header />

      {/* Top Hero Banner (Clean Dark Theme) */}
      <div className="bg-[#111111] text-white py-16 border-b border-[#dd1515]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-amber-500 font-extrabold text-[10px] uppercase tracking-widest bg-amber-500/10 px-3 py-1 border border-amber-500/20 rounded">
                🛡️ CLUB DETAILED ARCHIVE
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                {club.name} <span className="text-[#dd1515]">Profile</span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-xl">
                On-chain registry metadata parameters, verified squad listings, and access records for this football organization.
              </p>
            </div>
            <Link
              href="/clubs"
              className="bg-transparent hover:bg-white/10 text-white font-extrabold text-xs uppercase px-6 py-3 border border-zinc-500 hover:border-white transition-all duration-300"
            >
              ← Back to Clubs
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="space-y-12">
          {/* Top overview card */}
          <div className="bg-white border border-zinc-200 shadow-lg rounded-sm p-6 sm:p-8 flex flex-col lg:flex-row gap-8 items-stretch">
            
            {/* Badge visual */}
            <div className="bg-zinc-950 rounded-sm w-full lg:w-80 flex items-center justify-center p-8 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[#dd1515]/10 to-transparent z-0 opacity-40" />
              <img
                src={club.logoURI}
                alt={club.name}
                onError={handleImageError}
                className="h-40 w-auto object-contain z-10 filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Club metadata parameters */}
            <div className="flex-grow flex flex-col justify-between py-2 space-y-6 lg:space-y-0">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-[#dd1515] text-white font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm">
                    {club.league}
                  </span>
                  <span className="bg-zinc-100 text-zinc-800 border border-zinc-250 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-sm flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${club.status === "Verified" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {club.status} STATUS
                  </span>
                  <span className="text-zinc-400 font-mono text-[10px]">
                    REGISTRY ID: #{club.id}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-zinc-950 uppercase tracking-tight">
                  {club.name}
                </h2>

                <p className="text-xs text-zinc-500">
                  Located in <strong className="text-zinc-800">{club.city}, {club.country}</strong>. Registered on <strong className="text-zinc-800">{club.registeredAt}</strong>.
                </p>
              </div>



              <div className="pt-6">
                <center>
                {club.website && (
                  <a
                  href={club.website.startsWith("http") ? club.website : `https://${club.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-white bg-zinc-900 hover:bg-[#dd1515] px-6 py-3 uppercase tracking-wider transition-colors rounded-sm"
                  >
                    <span>Visit Club Website</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                </center>
              </div>

            </div>
          </div>

          {/* Squad section */}
          <div className="space-y-6">
            <div className="border-b border-zinc-200 pb-4 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight">Verified Squad Roster</h3>
                <p className="text-xs text-zinc-500 mt-1">Players registered under this club owner's standard access control parameters.</p>
              </div>
              <span className="bg-zinc-900 text-white font-mono text-xs font-bold px-3 py-1 rounded-sm">
                {squad.length} {squad.length === 1 ? "PLAYER" : "PLAYERS"}
              </span>
            </div>

            {squad.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded p-12 text-center text-zinc-500 text-xs">
                No verified players registered under this club's owner address at this time.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {squad.map((player) => (
                  <div key={player.id} className="bg-white border border-zinc-200 overflow-hidden group shadow-md hover:shadow-xl hover:border-[#dd1515]/30 transition-all duration-300 rounded-sm">
                    {/* Player Image container */}
                    <Link href={`/player/${player.id}`} className="block relative h-56 bg-zinc-50 overflow-hidden">
                      <img
                        src={player.imageURI}
                        alt={player.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-[#dd1515] text-white text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5">
                        {player.position}
                      </div>
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3">
                        <span className="text-[10px] text-zinc-300 block font-mono">ID: #{player.id}</span>
                        <span className="text-[11px] text-zinc-200 block font-bold">{player.nationality}</span>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <Link href={`/player/${player.id}`} className="hover:text-[#dd1515] transition-colors block">
                        <h4 className="text-md font-extrabold text-zinc-950 uppercase tracking-tight truncate">{player.name}</h4>
                      </Link>
                      
                      <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-zinc-100 pt-2">
                        <div>
                          <span className="text-zinc-400 block uppercase text-[8px] font-extrabold">Age</span>
                          <strong className="text-zinc-700 font-bold">{player.age} Years</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 block uppercase text-[8px] font-extrabold">Status</span>
                          <strong className="text-emerald-600 flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {player.status}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
