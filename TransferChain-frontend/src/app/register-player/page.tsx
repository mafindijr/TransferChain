"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import playerRegistry from "@/abis/PlayerRegistry.json";

// Types corresponding to TransferChain Smart Contracts
interface Player {
  id: number;
  owner: string;
  name: string;
  metadataURI: string;
  position: string;
  age: number;
  nationality: string;
  imageURI: string;
  status: string;
  registeredAt: string;
  currentClub: string;
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

const Address = '0x49335199e4121fc332cb5b11ce704250dea92cc8';

export default function RegisterPlayer() {
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
  const [position, setPosition] = useState("Forward");
  const [age, setAge] = useState(21);
  const [nationality, setNationality] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [customMetadataURI, setCustomMetadataURI] = useState("");
  const [isCustomURI, setIsCustomURI] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Auto-filled default values
  useEffect(() => {
    if (walletConnected && !ownerAddress) {
      setOwnerAddress(walletAddress);
    }
  }, [walletConnected, walletAddress, ownerAddress]);

  // Dynamic Metadata Construction
  const metadataJSON = {
    name: name || "[Enter Name]",
    position,
    age: Number(age),
    nationality: nationality || "[Enter Nationality]",
    imageURI,
    status: "Active",
    schema: "ipfs://bafkreidtransferchainplayer.json"
  };

  // Auto-generate a mock IPFS CID based on metadata contents
  const generatedCID = `ipfs://bafybeipplayer${Math.abs(
    (name + position + age + nationality).split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0)
  ).toString(36)}`;

  useEffect(() => {
    setImageURI(generatedCID);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      
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
        // Construct the IPFS URL using a public gateway
        const ipfsURL = `https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${data.ipfsHash}`;
        setImageURI(ipfsURL);
        triggerNotification("Player portrait uploaded to IPFS successfully!");
      } else {
        alert("Upload failed: No IPFS hash received from API.");
      }
    } catch (err: any) {
      console.error("IPFS Upload error:", err);
      alert(`Failed to upload player portrait to IPFS: ${err.message || err}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // State synchronization helper (adds a log directly to local storage)
  const addLocalLog = (event: string, contract: string, details: string) => {
    if (typeof window === "undefined") return;

    const storedLogs = localStorage.getItem("tc_logs");
    const currentLogs: TxLog[] = storedLogs ? JSON.parse(storedLogs) : [];

    const randomHash = "0x" + Math.random().toString(16).substring(2, 6) + "..." + Math.random().toString(16).substring(2, 6);
    const blockNum = currentLogs.length > 0 ? currentLogs[0].block + Math.floor(Math.random() * 5) + 1 : 1550000;
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

    localStorage.setItem("tc_logs", JSON.stringify([newLog, ...currentLogs]));
    return newLog;
  };

  // Submit function mapping to playerRegistry.registerPlayer ABI
  const Submit = async () => {
    const targetOwner = ownerAddress || walletAddress;
    
    // Capture state values to prevent closure stale state bugs
    const currentPlayerName = name;
    const currentPlayerOwner = targetOwner;
    const currentPlayerPosition = position;
    const currentPlayerAge = Number(age);
    const currentPlayerNationality = nationality;
    const currentPlayerImage = imageURI;

    setLoading(true);
    setLoadingStep("Uploading metadata document to IPFS...");

    try {
      // 1. Construct the metadata JSON payload
      const metadataPayload = {
        name: currentPlayerName,
        position: currentPlayerPosition,
        age: currentPlayerAge,
        nationality: currentPlayerNationality,
        imageURI: currentPlayerImage,
        status: "Active",
        schema: "ipfs://bafkreidtransferchainplayer.json"
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
        throw new Error("No IPFS hash returned for metadata document.");
      }

      const realMetadataURI = `ipfs://${ipfsCID}`;
      setLoadingStep("Awaiting signature confirmation from MetaMask...");

      // 3. Trigger smart contract write with the actual IPFS metadata URI
      writeContract({
        abi: playerRegistry,
        address: Address as `0x${string}`,
        functionName: 'registerPlayer',
        args: [targetOwner, realMetadataURI, currentPlayerName]
      }, {
        onSuccess: (txHash) => {
          setLoading(false);
          setSuccess(true);
          
          // Write to LocalStorage
          if (typeof window !== "undefined") {
            const storedPlayers = localStorage.getItem("tc_players");
            const currentPlayers: Player[] = storedPlayers ? JSON.parse(storedPlayers) : [];

            const newPlayer: Player = {
              id: currentPlayers.length + 1,
              owner: currentPlayerOwner,
              name: currentPlayerName,
              metadataURI: realMetadataURI,
              position: currentPlayerPosition,
              age: currentPlayerAge,
              nationality: currentPlayerNationality,
              imageURI: currentPlayerImage,
              status: "Active",
              registeredAt: new Date().toISOString().replace("T", " ").substring(0, 16),
              currentClub: "Free Agent",
            };

            localStorage.setItem("tc_players", JSON.stringify([...currentPlayers, newPlayer]));

            // Log transaction
            const log = addLocalLog(
              "PlayerRegistered",
              "PlayerRegistry.sol",
              `Player Registered: ${currentPlayerName} (ID: ${newPlayer.id}) on Injective EVM. Tx: ${txHash}`
            );

            if (log) {
              setTxDetails({ hash: txHash, block: log.block });
            }
          }
          triggerNotification(`Player "${currentPlayerName}" registered successfully on PlayerRegistry!`);
        },
        onError: (err) => {
          setLoading(false);
          alert(`Transaction failed: ${err.message || err}`);
        }
      });

    } catch (ipfsErr: any) {
      setLoading(false);
      console.error("IPFS Metadata Upload error:", ipfsErr);
      alert(`Failed to pin player metadata to IPFS: ${ipfsErr.message || ipfsErr}`);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletConnected) {
      alert("Please connect your Web3 wallet first!");
      return;
    }

    if (!name) {
      alert("Player Name is required.");
      return;
    }

    if (!nationality) {
      alert("Player Nationality is required.");
      return;
    }

    const targetOwner = ownerAddress || walletAddress;
    if (!targetOwner.startsWith("0x") || targetOwner.length !== 42) {
      alert("Please enter a valid Ethereum address for the Player Owner.");
      return;
    }

    try {
      Submit();
    } catch (err) {
      console.error(err);
      alert("Failed to submit transaction.");
    }
  };



  const resetForm = () => {
    setName("");
    setNationality("");
    setAge(21);
    setPosition("Forward");
    setImageURI("/img/soccer/soccer-1.jpg");
    setSuccess(false);
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
                ⚙️ PLAYER'S REGISTRATION PORTAL
              </span>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                Register New <span className="text-[#dd1515]">Player</span>
              </h1>
              <p className="text-zinc-400 text-xs sm:text-sm font-light max-w-xl">
                Onboard professional soccer players to the TransferChain ledger. Generate metadata JSON structures, mint IPFS CID pointers, and invoke standard registry smart contract parameters.
              </p>
            </div>
            <button
              onClick={() => router.push("/#players")}
              className="bg-transparent hover:bg-white/10 text-white font-extrabold text-xs uppercase px-6 py-3 border border-zinc-500 hover:border-white transition-all duration-300"
            >
              ← Back to Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Main Registration Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="">
          
          {/* Left Column: Form (8 Columns) */}
          <div className="lg:col-span-12 bg-white border border-zinc-200 p-8 shadow-lg rounded-sm space-y-6">
            
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
                  <h3 className="text-2xl font-black text-zinc-900 uppercase">Registration Successful!</h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Player profile has been successfully registered.
                  </p>
                </div>

                <div className="bg-[#fcfcfd] border border-zinc-200 p-5 rounded-sm max-w-md mx-auto text-left space-y-2 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">STATUS:</span>
                    <span className="text-emerald-600 font-bold">CONFIRMED </span>
                  </div>
                  
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => router.push("/marketplace")}
                    className="bg-[#dd1515] hover:bg-zinc-950 text-white font-extrabold text-xs uppercase px-6 py-3.5 tracking-wider transition-colors"
                  >
                    View in Player Feed
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wider animate-pulse">
                    Loading ...
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-wide">{loadingStep}</p>
                </div>
              </div>
            ) : (
              /* Main Registration Form */
              <form onSubmit={handleRegister} className="space-y-6">
                
                <div className="border-b border-zinc-200 pb-4">
                  <h3 className="font-extrabold text-sm text-zinc-950 uppercase tracking-wider">
                    Register New Player Profile
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Fill in the form below to register a new player on the TransferChain protocol.
                  </p>
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                  {/* Player Name */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                      Player Name <span className="text-[#dd1515]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bukayo Saka"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  

                  {/* Position */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider">Position</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    >
                      <option>Forward</option>
                      <option>Striker</option>
                      <option>Midfielder</option>
                      <option>Defender</option>
                      <option>Goalkeeper</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider">Age</label>
                    <input
                      type="number"
                      min={16}
                      max={45}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  {/* Nationality */}
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider">
                      Nationality <span className="text-[#dd1515]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. England"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full px-4 py-3 bg-[#fcfcfd] border border-zinc-300 rounded text-sm text-zinc-900 focus:border-[#dd1515] focus:outline-none"
                    />
                  </div>

                  {/* Profile Image Input Selector */}
                  <div className="grid gap-6">
                    {/* File Input upload */}
                    <div className="space-y-2">
                      <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
                        Upload Portrait to IPFS
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="w-full px-3 py-2 bg-[#fcfcfd] border border-zinc-300 rounded text-xs text-zinc-900 focus:border-[#dd1515] focus:outline-none file:mr-3 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-[10px] file:font-extrabold file:bg-zinc-900 file:text-white hover:file:bg-[#dd1515] file:cursor-pointer file:transition-colors"
                      />
                      {uploadingImage && (
                        <p className="text-[9px] text-[#dd1515] font-mono animate-pulse">Uploading file to IPFS node...</p>
                      )}
                    </div>
              </div>
                    
                  <div className="space-y-2">
                    <label className="text-[11px] text-zinc-500 uppercase font-black tracking-wider">
                      Img Url
                    </label>

                    <div className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded text-xs font-mono text-zinc-500 overflow-x-auto whitespace-nowrap">
                      {imageURI}
                    </div>
                  </div>
                </div>
                {/* Submit button */}
                <center>
                  <button
                    type="submit"
                    disabled={!walletConnected}
                    onClick={handleRegister}
                    className="rounded bg-[#dd1515] hover:bg-[#111111] text-white disabled:bg-zinc-350 disabled:cursor-not-allowed font-extrabold text-sm tracking-wider uppercase px-8 py-3.5 transition-all duration-300 shadow-md shadow-[#dd1515]/20 hover:shadow-black/10"
                  >
                     Register Player
                  </button>
                </center>
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
