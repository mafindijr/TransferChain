"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import clubRegistry from "@/abis/ClubRegistry.json";

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
  status: string;
  registeredAt: string;
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

const Address = process.env.NEXT_PUBLIC_CLUB_REGISTRY || '0x873ae71139407889650b74b24da51643a0e680eb';

export default function RegisterClub() {
  const router = useRouter();

  // Web3 Connection hooks
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();
  const walletConnected = isConnected;
  const walletAddress = address || "";

  // Contract Write hooks
  const { writeContract, data: hash, error: contractError, isPending: isContractPending } = useWriteContract();

  // Form Inputs
  const [name, setName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [league, setLeague] = useState("Premier League");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [logoURI, setLogoURI] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Auto-filled default values
  useEffect(() => {
    if (walletConnected && !ownerAddress) {
      setOwnerAddress(walletAddress);
    }
  }, [walletConnected, walletAddress, ownerAddress]);

  // Generate placeholder logo CID initially
  useEffect(() => {
    const generatedCID = `ipfs://bafybeiclub${Math.abs(
      (name + league + country + city).split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
    ).toString(36)}`;
    setLogoURI(generatedCID);
  }, []);

  // Submission States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [success, setSuccess] = useState(false);
  const [txDetails, setTxDetails] = useState({ hash: "", block: 0 });

  // Notifications State
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-ipfs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();
      if (data.ipfsHash) {
        // Construct the IPFS URL using Pinata gateway
        const ipfsURL = `https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${data.ipfsHash}`;
        setLogoURI(ipfsURL);
        triggerNotification("Club logo uploaded to IPFS successfully!");
      } else {
        alert("Upload failed: No IPFS hash received from API.");
      }
    } catch (err: any) {
      console.error("IPFS Upload error:", err);
      alert(`Failed to upload club logo to IPFS: ${err.message || err}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  // Submit function mapping to clubRegistry.registerClub ABI
  const Submit = async () => {
    const targetOwner = ownerAddress || walletAddress;
    
    // Capture state values to prevent closure stale state bugs
    const currentClubName = name;
    const currentClubOwner = targetOwner;
    const currentClubLeague = league;
    const currentClubCountry = country;
    const currentClubCity = city;
    const currentClubWebsite = website || `${name.toLowerCase().replace(/\s+/g, "")}.com`;
    const currentClubLogo = logoURI;

    setLoading(true);
    setLoadingStep("Uploading metadata document to IPFS...");

    try {
      // 1. Construct the metadata JSON payload
      const metadataPayload = {
        name: currentClubName,
        league: currentClubLeague,
        country: currentClubCountry,
        city: currentClubCity,
        website: currentClubWebsite,
        logoURI: currentClubLogo,
        status: "Verified",
        schema: "ipfs://bafkreidtransferchainclub.json"
      };

      // 2. Upload metadata JSON to IPFS via API route
      const uploadRes = await fetch("/api/upload-ipfs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(metadataPayload)
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Metadata IPFS upload failed");
      }

      const uploadData = await uploadRes.json();
      const ipfsCID = uploadData.ipfsHash;
      if (!ipfsCID) {
        throw new Error("No hash returned for metadata document.");
      }

      const realMetadataURI = `ipfs://${ipfsCID}`;
      setLoadingStep("Awaiting signature confirmation from Provider...");

      // 3. Trigger smart contract write with the actual IPFS metadata URI and parameters
      writeContract({
        abi: clubRegistry,
        address: Address as `0x${string}`,
        functionName: 'registerClub',
        args: [
          targetOwner,
          currentClubName,
          realMetadataURI,
          currentClubCountry,
          currentClubCity,
          currentClubLeague,
          currentClubLogo,
          currentClubWebsite
        ]
      }, {
        onSuccess: (txHash) => {
          setLoading(false);
          setSuccess(true);
          setTxDetails({ hash: txHash, block: 0 });
          triggerNotification(`Club "${currentClubName}" registered successfully on ClubRegistry!`);
        },
        onError: (err) => {
          setLoading(false);
          alert(`Transaction failed: ${err.message || err}`);
        }
      });

    } catch (ipfsErr: any) {
      setLoading(false);
      console.error("IPFS Metadata Upload error:", ipfsErr);
      alert(`Failed to pin club metadata to IPFS: ${ipfsErr.message || ipfsErr}`);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletConnected) {
      alert("Please connect your Web3 wallet first!");
      return;
    }

    if (!name) {
      alert("Club Name is required.");
      return;
    }

    if (!country) {
      alert("Country is required.");
      return;
    }

    if (!city) {
      alert("City is required.");
      return;
    }

    const targetOwner = ownerAddress || walletAddress;
    if (!targetOwner.startsWith("0x") || targetOwner.length !== 42) {
      alert("Please enter a valid Ethereum address for the Club Owner.");
      return;
    }

    try {
      Submit();
    } catch (err) {
      console.error(err);
      alert("Failed to submit transaction.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-[#444444] font-sans selection:bg-[#dd1515] selection:text-white">
      {/* Dynamic Header */}
      <Header />

      {/* Notifications Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-[#dd1515] text-white border-2 border-white px-6 py-4 rounded shadow-2xl z-[99999] animate-bounce flex items-center gap-3">
          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-bold tracking-wide">{notification}</span>
        </div>
      )}

      {/* Top Banner (Clean Dark Theme) */}
      <div className="bg-[#111111] text-white py-16 border-b border-[#dd1515]/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-amber-500 font-extrabold text-[10px] uppercase tracking-widest bg-amber-500/10 px-3 py-1 border border-amber-500/20 rounded">
                🛡️ CLUB'S REGISTRATION PORTAL
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Register New <span className="text-[#dd1515]">Club</span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-xl">
                Onboard professional football clubs to the TransferChain ledger. Generate metadata JSON structures, upload club badges to IPFS, and execute standard registry smart contract parameters.
              </p>
            </div>
            <button
              onClick={() => router.push("/clubs")}
              className="bg-transparent hover:bg-white/10 text-white font-extrabold text-xs uppercase px-6 py-3 border border-zinc-500 hover:border-white transition-all duration-300"
            >
              ← Back to Clubs
            </button>
          </div>
        </div>
      </div>

      {/* Main Registration Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div>
          
          {/* Form Container */}
          <div className="bg-white border border-zinc-200 p-8 shadow-lg rounded-sm space-y-6">
            
            {/* Warning if wallet disconnected */}
            {!walletConnected && (
              <div className="bg-red-500/5 border border-red-500/25 p-5 text-center space-y-3 rounded">
                <h4 className="text-red-600 font-extrabold text-xs uppercase tracking-wide">Wallet Not Connected</h4>
                <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                  CONNECT YOUR WALLET TO CONTINUE
                </p>
                <button
                  onClick={() => open()}
                  className="bg-[#dd1515] hover:bg-[#111111] text-white text-xs font-extrabold px-6 py-2.5 transition-colors uppercase tracking-wider"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            {/* Success Overlay */}
            {success ? (
              <div className="text-center py-12 space-y-6 animate-fade-in">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-300 shadow">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-zinc-950 uppercase">Registration Successful!</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Club profile has been successfully registered on the blockchain.
                  </p>
                </div>

                <div className="bg-[#fcfcfd] border border-zinc-200 p-5 rounded-sm max-w-md mx-auto text-left space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">STATUS:</span>
                    <span className="text-emerald-600 font-bold">CONFIRMED</span>
                  </div>
                  {txDetails.hash && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">TX HASH:</span>
                        <span className="text-zinc-800 text-[10px] break-all">{txDetails.hash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-400">BLOCK:</span>
                        <span className="text-zinc-800">{txDetails.block}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => router.push("/clubs")}
                    className="bg-[#dd1515] hover:bg-zinc-950 text-white font-extrabold text-xs uppercase px-6 py-3.5 tracking-wider transition-colors"
                  >
                    Go to Clubs List
                  </button>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setName("");
                      setCountry("");
                      setCity("");
                      setWebsite("");
                    }}
                    className="bg-transparent border border-zinc-300 hover:border-zinc-850 hover:bg-zinc-50 text-zinc-700 font-extrabold text-xs uppercase px-6 py-3.5 tracking-wider transition-all"
                  >
                    Register Another
                  </button>
                </div>
              </div>
            ) : loading ? (
              /* Loading Spinner */
              <div className="text-center py-20 space-y-6">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-100 border-t-[#dd1515] animate-spin" />
                  <div className="w-10 h-10 rounded-full bg-[#dd1515]/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#dd1515] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider animate-pulse">
                    Onboarding Club...
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wide">{loadingStep}</p>
                </div>
              </div>
            ) : (
              /* Main Registration Form */
              <form onSubmit={handleRegister} className="space-y-6">
                
                <div className="border-b border-zinc-200 pb-4">
                  <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider">
                    Register New Club Profile
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Fill in the form below to onboard a new football club to the TransferChain ledger.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Club Name */}
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                      Club Name <span className="text-[#dd1515]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arsenal FC"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  {/* League */}
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                      League <span className="text-[#dd1515]">*</span>
                    </label>
                    <select
                      value={league}
                      onChange={(e) => setLeague(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    >
                      <option>Premier League</option>
                      <option>La Liga</option>
                      <option>Serie A</option>
                      <option>Bundesliga</option>
                      <option>Ligue 1</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                      Country <span className="text-[#dd1515]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. England"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  {/* City */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                      City <span className="text-[#dd1515]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. London"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider">
                      Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.arsenal.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  {/* Owner Address */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                      Club Owner Address <span className="text-[#dd1515]"></span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                      value={ownerAddress}
                      disabled
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  {/* Club Logo Image Upload to IPFS */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                      Upload Club Badge
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="w-full px-3 py-2 bg-[#fcfcfd] border border-zinc-300 rounded text-xs text-zinc-900 focus:border-[#dd1515] focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-[10px] file:font-extrabold file:bg-zinc-900 file:text-white hover:file:bg-[#dd1515] file:cursor-pointer file:transition-colors"
                    />
                    {uploadingLogo && (
                      <p className="text-[9px] text-[#dd1515] font-mono animate-pulse">Uploading badge image to IPFS node...</p>
                    )}
                  </div>

                  {/* Logo Image URL Display */}
                  <div className="space-y-2 col-span-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider">
                      Badge URL 
                    </label>
                    <div className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded text-xs font-mono text-zinc-500 overflow-x-auto whitespace-nowrap">
                      {logoURI}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="text-center pt-4">
                  <button
                    type="submit"
                    disabled={!walletConnected}
                    className="rounded bg-[#dd1515] hover:bg-[#111111] text-white disabled:bg-zinc-350 disabled:cursor-not-allowed font-extrabold text-sm tracking-wider uppercase px-8 py-3.5 transition-all duration-300 shadow-md shadow-[#dd1515]/20 hover:shadow-black/10"
                  >
                    Register Club
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </main>

      {/* Dynamic Footer */}
      <Footer />
    </div>
  );
}
