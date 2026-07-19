"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { usePublicClient, useAccount } from "wagmi";
import clubRegistryAbi from "@/abis/ClubRegistry.json";

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

const Address = process.env.NEXT_PUBLIC_CLUB_REGISTRY || '0x873ae71139407889650b74b24da51643a0e680eb';


export default function ClubsPage() {
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLeague, setFilterLeague] = useState("All");

  // Load default clubs initially
  useEffect(() => {
    
  }, []);

  // Fetch live clubs registered on the smart contract
  useEffect(() => {
    async function fetchOnChainClubs() {
      if (!publicClient) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch nextClubId from ClubRegistry contract
        const nextId = await publicClient.readContract({
          address: Address as `0x${string}`,
          abi: clubRegistryAbi,
          functionName: "nextClubId"
        }) as bigint;

        const totalClubs = Number(nextId) - 1;
        const fetchedClubs: Club[] = [];

        for (let i = 1; i <= totalClubs; i++) {
          try {
            const ownerAddress = await publicClient.readContract({
              address: Address as `0x${string}`,
              abi: clubRegistryAbi,
              functionName: "getClubOwner",
              args: [BigInt(i)]
            }) as string;

            if (ownerAddress && ownerAddress !== "0x0000000000000000000000000000000000000000") {
              const onChainClub = await publicClient.readContract({
                address: Address as `0x${string}`,
                abi: clubRegistryAbi,
                functionName: "getClub",
                args: [ownerAddress]
              }) as any;

              if (onChainClub) {
                const name = onChainClub.name || "Unknown Club";
                const country = onChainClub.country || "";
                const city = onChainClub.city || "";
                const league = onChainClub.league || "";
                let logoURI = onChainClub.logoURI || `/img/match/tf-${(i % 5) + 1}.jpg`;
                const website = onChainClub.website || "";
                const status = onChainClub.status === 1 ? "Verified" : onChainClub.status === 0 ? "Suspended" : "Pending";
                const metadataURI = onChainClub.metadataURI || "";

                // Standardize logo url gateway if it's ipfs format
                if (logoURI.startsWith("ipfs://")) {
                  const cid = logoURI.replace("ipfs://", "");
                  logoURI = `https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${cid}`;
                }

                fetchedClubs.push({
                  id: i,
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
                });
              }
            }
          } catch (err) {
            console.error(`Error loading club index ${i} from contract:`, err);
          }
        }

        if (fetchedClubs.length > 0) {
          // Merge on-chain clubs with memory-stored clubs, prioritizing on-chain data
          setClubs((prevClubs) => {
            const merged = [...prevClubs];
            fetchedClubs.forEach((onChain) => {
              const index = merged.findIndex((c) => c.owner.toLowerCase() === onChain.owner.toLowerCase() || c.name.toLowerCase() === onChain.name.toLowerCase());
              if (index !== -1) {
                merged[index] = { ...merged[index], ...onChain };
              } else {
                merged.push(onChain);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Direct contract query failed for clubs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOnChainClubs();
  }, [publicClient]);

  // Handle image error load fallbacks
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, id: number) => {
    e.currentTarget.src = `/img/match/tf-${(id % 5) + 1}.jpg`;
  };

  // Filter and Search logic
  const filteredClubs = clubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.league.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLeague = filterLeague === "All" || club.league === filterLeague;

    return matchesSearch && matchesLeague;
  });

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
      {/* Header */}
      <Header />

      {/* Hero Banner (Specer Clean Dark Style) */}
      <div className="bg-[#111111] text-white py-16 border-b border-[#dd1515]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-amber-500 font-extrabold text-[10px] uppercase tracking-widest bg-amber-500/10 px-3 py-1 border border-amber-500/20 rounded">
                🏟️ CLUB REGISTRY DATABASE
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Registered <span className="text-[#dd1515]">Clubs</span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-xl">
                Browse official football clubs stored on the TransferChain smart contracts. View club owners, verified status, and onboard new organizations.
              </p>
            </div>
            <Link
              href="/clubs/register"
              className="bg-[#dd1515] hover:bg-white hover:text-black text-white font-extrabold text-xs uppercase px-6 py-3.5 border border-[#dd1515] hover:border-white transition-all duration-300 tracking-wider shadow-lg shadow-[#dd1515]/20"
            >
              + Register New Club
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white border border-zinc-200 p-5 rounded-sm shadow-sm mb-10">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by name, country, city, league..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
            />
            <span className="absolute left-3.5 top-3.5 text-zinc-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>

          {/* League Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-[11px] uppercase font-black tracking-wider text-zinc-500">Filter League:</span>
            <select
              value={filterLeague}
              onChange={(e) => setFilterLeague(e.target.value)}
              className="px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none font-bold"
            >
              <option value="All">All Leagues</option>
              <option value="Premier League">Premier League</option>
              <option value="La Liga">La Liga</option>
              <option value="Serie A">Serie A</option>
              <option value="Bundesliga">Bundesliga</option>
              <option value="Ligue 1">Ligue 1</option>
            </select>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && clubs.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#dd1515] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">Loading Club Directory...</p>
          </div>
        ) : filteredClubs.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-zinc-200 rounded p-16 text-center max-w-md mx-auto shadow-md">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-300">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 uppercase">No Clubs Found</h3>
            <p className="text-xs text-zinc-500 mt-2 mb-6">
              No registered clubs matched your search criteria. Try adjusting your filters or search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterLeague("All");
              }}
              className="bg-zinc-900 hover:bg-[#dd1515] text-white text-xs font-extrabold px-6 py-2.5 transition-colors uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Clubs Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClubs.map((club) => (
              <div
                key={club.id}
                className="bg-white border border-zinc-200 overflow-hidden group shadow-md hover:shadow-2xl hover:border-[#dd1515]/30 hover:-translate-y-2 transition-all duration-500 ease-out rounded-sm flex flex-col justify-between"
              >
                {/* Badge Image Card Top */}
                <Link href={`/clubs/view/${club.id}`} className="relative h-48 bg-zinc-950 flex items-center justify-center p-6 overflow-hidden block cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#dd1515]/10 to-transparent z-0 opacity-40" />
                  
                  {/* Badge image */}
                  <img
                    src={club.logoURI}
                    alt={club.name}
                    onError={(e) => handleImageError(e, club.id)}
                    className="h-28 w-auto object-contain z-10 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Status Tag */}
                  <div className="absolute top-4 right-4 bg-[#111111]/80 backdrop-blur border border-zinc-700 text-zinc-200 text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 z-10 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${club.status === "Verified" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    {club.status}
                  </div>

                  {/* ID Tag */}
                  <div className="absolute bottom-4 left-4 text-zinc-500 text-[10px] font-mono z-10">
                    CLUB ID: #{club.id}
                  </div>
                </Link>

                {/* Card Content */}
                <div className="p-6 flex-grow flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <Link href={`/clubs/view/${club.id}`} className="hover:text-[#dd1515] transition-colors block">
                      <h3 className="text-xl font-black text-zinc-950 uppercase tracking-tight">
                        {club.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-bold text-zinc-800">{club.city}, {club.country}</span>
                      <span>•</span>
                      <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-extrabold">{club.league}</span>
                    </div>
                  </div>

                  {/* Details list */}
                  <div className="border-t border-zinc-150 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-extrabold uppercase text-[9px]">Owner Address:</span>
                      <span className="text-zinc-700 font-mono text-[10px] font-bold" title={club.owner}>
                        {club.owner.substring(0, 6)}...{club.owner.substring(club.owner.length - 4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400 font-extrabold uppercase text-[9px]">Registered At:</span>
                      <span className="text-zinc-600 font-medium">{club.registeredAt}</span>
                    </div>
                    {club.website && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400 font-extrabold uppercase text-[9px]">Website:</span>
                        <a
                          href={club.website.startsWith("http") ? club.website : `https://${club.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#dd1515] hover:underline font-bold"
                        >
                          {club.website.replace("https://", "").replace("www.", "")}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
