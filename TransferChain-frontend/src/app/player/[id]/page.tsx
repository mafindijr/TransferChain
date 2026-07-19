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
import escrowAbi from "@/abis/Escrow.json";
import { toast } from "react-toastify";

interface PlayerDetails {
  id: number;
  owner: string;
  clubName?: string;
  clubId?: number | null;
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

interface EscrowDeposit {
  id: number;
  token: string;
  amount: bigint;
  agreementId: number;
  payer: string;
  payee: string;
  status: number;
  createdAt: number;
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
  deposits?: EscrowDeposit[];
}

const PlayerRegistryAddress = process.env.NEXT_PUBLIC_PLAYER_REGISTRY || "0x49335199e4121fc332cb5b11ce704250dea92cc8";
const ClubRegistryAddress = process.env.NEXT_PUBLIC_CLUB_REGISTRY || "0x873ae71139407889650b74b24da51643a0e680eb";
const TransferMarketplaceAddress = process.env.NEXT_PUBLIC_TRANSFER_MARKET_PLACE || "0x6bc6dd2cc4f5c2c1ab6b0387ed95ec5b543eef1a";
const TransferAgreementManagerAddress = process.env.NEXT_PUBLIC_TRANSFER_AGREEMENT_MANAGER || "0x4e9865d82174376b1246e982311d85b8cc1297f8";
const EscrowAddress = process.env.NEXT_PUBLIC_ESCROW || "0xded509f4c002e4013e96cec6b3ad87bf5213c68d";
const DefaultTokenAddress = process.env.NEXT_PUBLIC_PAYMENT_TOKEN || "0x0000000000000000000000000000000000000001";

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

  // Metadata Update States
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editNationality, setEditNationality] = useState("");
  const [editImageURI, setEditImageURI] = useState("");
  const [editMetadataURI, setEditMetadataURI] = useState("");
  const [useDirectURI, setUseDirectURI] = useState(false);
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Escrow States
  const [depositingAgreementId, setDepositingAgreementId] = useState<number | null>(null);
  const [releasingDepositId, setReleasingDepositId] = useState<number | null>(null);
  const [refundingDepositId, setRefundingDepositId] = useState<number | null>(null);

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

      // Fetch Club details from ClubRegistry
      let clubName = "";
      let clubId: number | null = null;
      try {
        const onChainClub = await publicClient.readContract({
          address: ClubRegistryAddress as `0x${string}`,
          abi: clubRegistryAbi,
          functionName: "getClub",
          args: [ownerAddress]
        }) as any;

        if (onChainClub && onChainClub.name && onChainClub.name.trim() !== "") {
          clubName = onChainClub.name;
          clubId = Number(onChainClub.id || 0);
        }
      } catch (clubErr) {
        console.warn("Could not fetch club from ClubRegistry:", clubErr);
      }

      if (!clubName && typeof window !== "undefined") {
        const storedClubs = localStorage.getItem("tc_clubs");
        if (storedClubs) {
          try {
            const currentClubs = JSON.parse(storedClubs);
            const foundClub = currentClubs.find((c: any) => c.owner && c.owner.toLowerCase() === ownerAddress.toLowerCase());
            if (foundClub) {
              clubName = foundClub.name;
              clubId = foundClub.id;
            }
          } catch (e) {}
        }
      }

      if (!clubName) {
        clubName = `Club (${ownerAddress.substring(0, 6)}...${ownerAddress.substring(ownerAddress.length - 4)})`;
      }

      setPlayer({ 
        id: currentId,
        owner: ownerAddress,
        clubName,
        clubId,
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

      // 5. Fetch Escrow deposits on-chain via getDeposit for each agreement
      try {
        const nextDepId = await publicClient.readContract({
          address: EscrowAddress as `0x${string}`,
          abi: escrowAbi,
          functionName: "nextDepositId"
        }) as bigint;

        const totalDeposits = Number(nextDepId);
        const fetchedDeposits: EscrowDeposit[] = [];

        for (let dId = 1; dId < totalDeposits; dId++) {
          try {
            const rawDeposit = await publicClient.readContract({
              address: EscrowAddress as `0x${string}`,
              abi: escrowAbi,
              functionName: "getDeposit",
              args: [BigInt(dId)]
            }) as any;

            if (rawDeposit && Number(rawDeposit.id) > 0) {
              fetchedDeposits.push({
                id: Number(rawDeposit.id),
                token: rawDeposit.token,
                amount: BigInt(rawDeposit.amount || 0),
                agreementId: Number(rawDeposit.agreementId),
                payer: rawDeposit.payer,
                payee: rawDeposit.payee,
                status: Number(rawDeposit.status),
                createdAt: Number(rawDeposit.createdAt)
              });
            }
          } catch (dErr) {
            console.warn(`Could not fetch deposit ${dId}:`, dErr);
          }
        }

        const agreementsWithDeposits = fetchedAgreements.map(ag => ({
          ...ag,
          deposits: fetchedDeposits.filter(d => d.agreementId === ag.id)
        }));

        setAgreements(agreementsWithDeposits);
      } catch (escrowErr) {
        console.warn("Could not fetch Escrow deposits:", escrowErr);
        setAgreements(fetchedAgreements);
      }

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

  // ── Escrow Operations (Escrow.sol) ───────────────────────────

  // 1. Deposit funds to Escrow for an agreement (deposit)
  const handleEscrowDeposit = async (agreementId: number, payee: string, amount: bigint) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setDepositingAgreementId(agreementId);

      writeContract({
        address: EscrowAddress as `0x${string}`,
        abi: escrowAbi,
        functionName: "deposit",
        args: [
          DefaultTokenAddress as `0x${string}`,
          amount > BigInt(0) ? amount : BigInt(1000),
          BigInt(agreementId),
          payee as `0x${string}`
        ]
      }, {
        onSuccess: () => {
          toast.success(`Deposit created and funded successfully in Escrow!`);
          fetchPlayerDetails();
          setDepositingAgreementId(null);
        },
        onError: (err) => {
          toast.error(`Escrow deposit failed: ${err.message || err}`);
          setDepositingAgreementId(null);
        }
      });
    } catch (err: any) {
      console.error("Error creating escrow deposit:", err);
      toast.error(`Error: ${err.message || err}`);
      setDepositingAgreementId(null);
    }
  };

  // 2. Release & withdraw escrowed funds to seller/payee (release)
  const handleEscrowRelease = async (depositId: number) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setReleasingDepositId(depositId);

      writeContract({
        address: EscrowAddress as `0x${string}`,
        abi: escrowAbi,
        functionName: "release",
        args: [BigInt(depositId)]
      }, {
        onSuccess: () => {
          toast.success(`Escrow funds released & withdrawn to seller successfully!`);
          fetchPlayerDetails();
          setReleasingDepositId(null);
        },
        onError: (err) => {
          toast.error(`Escrow release failed: ${err.message || err}`);
          setReleasingDepositId(null);
        }
      });
    } catch (err: any) {
      console.error("Error releasing escrow deposit:", err);
      toast.error(`Error: ${err.message || err}`);
      setReleasingDepositId(null);
    }
  };

  // 3. Refund escrowed funds to buyer/payer (refund)
  const handleEscrowRefund = async (depositId: number) => {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setRefundingDepositId(depositId);

      writeContract({
        address: EscrowAddress as `0x${string}`,
        abi: escrowAbi,
        functionName: "refund",
        args: [BigInt(depositId)]
      }, {
        onSuccess: () => {
          toast.success(`Escrow funds refunded to buyer successfully!`);
          fetchPlayerDetails();
          setRefundingDepositId(null);
        },
        onError: (err) => {
          toast.error(`Escrow refund failed: ${err.message || err}`);
          setRefundingDepositId(null);
        }
      });
    } catch (err: any) {
      console.error("Error refunding escrow deposit:", err);
      toast.error(`Error: ${err.message || err}`);
      setRefundingDepositId(null);
    }
  };

  const openEditMetadataModal = () => {
    if (!player) return;
    setEditName(player.name || "");
    setEditPosition(player.position !== "N/A" ? player.position : "");
    setEditAge(player.age !== null ? String(player.age) : "");
    setEditNationality(player.nationality !== "N/A" ? player.nationality : "");
    setEditImageURI(player.imageURI || "");
    setEditMetadataURI(player.metadataURI || "");
    setIsEditingMetadata(true);
  };

  const addLocalLog = (event: string, contract: string, details: string) => {
    if (typeof window === "undefined") return;

    const storedLogs = localStorage.getItem("tc_logs");
    const currentLogs: any[] = storedLogs ? JSON.parse(storedLogs) : [];

    const randomHash = "0x" + Math.random().toString(16).substring(2, 6) + "..." + Math.random().toString(16).substring(2, 6);
    const blockNum = currentLogs.length > 0 ? currentLogs[0].block + Math.floor(Math.random() * 5) + 1 : 1550000;
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);

    const newLog = {
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

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        throw new Error(errorData.error || "Image upload failed");
      }

      const data = await res.json();
      if (data.ipfsHash) {
        const ipfsURL = `https://amethyst-patient-pheasant-516.mypinata.cloud/ipfs/${data.ipfsHash}`;
        setEditImageURI(ipfsURL);
        toast.success("Player portrait uploaded to IPFS successfully!");
      } else {
        toast.error("Upload failed: No IPFS hash returned.");
      }
    } catch (err: any) {
      console.error("IPFS Image upload error:", err);
      toast.error(`Image upload failed: ${err.message || err}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Function mapping to PlayerRegistry.updatePlayerMetadata ABI
  const handleUpdatePlayerMetadata = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress || !player) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (walletAddress.toLowerCase() !== player.owner.toLowerCase()) {
      toast.error("Unauthorized: Only the player owner can update metadata.");
      return;
    }

    setUpdatingMetadata(true);

    try {
      let finalMetadataURI = editMetadataURI.trim();

      if (!useDirectURI) {
        const metadataPayload = {
          name: editName.trim() || player.name,
          position: editPosition.trim() || player.position,
          age: editAge ? Number(editAge) : player.age,
          nationality: editNationality.trim() || player.nationality,
          imageURI: editImageURI.trim() || player.imageURI,
          status: player.status,
          schema: "ipfs://bafkreidtransferchainplayer.json"
        };

        const uploadRes = await fetch("/api/upload-ipfs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(metadataPayload)
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || "Metadata IPFS upload failed");
        }

        const uploadData = await uploadRes.json();
        if (!uploadData.ipfsHash) {
          throw new Error("No IPFS hash returned for metadata document.");
        }

        finalMetadataURI = `ipfs://${uploadData.ipfsHash}`;
      }

      if (!finalMetadataURI) {
        throw new Error("Metadata URI cannot be empty.");
      }

      writeContract({
        address: PlayerRegistryAddress as `0x${string}`,
        abi: playerRegistryAbi,
        functionName: "updatePlayerMetadata",
        args: [player.owner as `0x${string}`, finalMetadataURI]
      }, {
        onSuccess: (txHash) => {
          setUpdatingMetadata(false);
          setIsEditingMetadata(false);

          if (typeof window !== "undefined") {
            const storedPlayers = localStorage.getItem("tc_players");
            if (storedPlayers) {
              const currentPlayers = JSON.parse(storedPlayers);
              const updatedPlayers = currentPlayers.map((p: any) => {
                if (p.id === player.id || (p.owner && p.owner.toLowerCase() === player.owner.toLowerCase())) {
                  return {
                    ...p,
                    name: editName.trim() || p.name,
                    position: editPosition.trim() || p.position,
                    age: editAge ? Number(editAge) : p.age,
                    nationality: editNationality.trim() || p.nationality,
                    imageURI: editImageURI.trim() || p.imageURI,
                    metadataURI: finalMetadataURI
                  };
                }
                return p;
              });
            }

          }

          toast.success(`Player data updated successfully on PlayerRegistry!`);
          fetchPlayerDetails();
        },
        onError: (err) => {
          setUpdatingMetadata(false);
          toast.error(`Failed to update data`);
        }
      });
    } catch (err: any) {
      console.error("Error updating player metadata:", err);
      toast.error(`Metadata Update Error: ${err.message || err}`);
      setUpdatingMetadata(false);
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

                {/* Identity Ownership & Metadata Information */}
                <div className="bg-white border border-zinc-200 p-6 space-y-4 shadow-sm text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-zinc-400 font-extrabold uppercase text-[9px] tracking-wider block">Registrant Club</span>
                      <div className="font-extrabold text-zinc-900 text-base mt-1 flex flex-wrap items-center gap-2">
                        {player.clubId ? (
                          <Link href={`/clubs/view/${player.clubId}`} className="hover:text-[#dd1515] transition-colors flex items-center gap-1.5">
                            🏰 {player.clubName}
                          </Link>
                        ) : (
                          <span className="flex items-center gap-1.5">🏰 FC</span>
                        )}
                        
                      </div>
                    </div>
                    {isPlayerOwner && !isEditingMetadata && (
                      <button
                        type="button"
                        onClick={openEditMetadataModal}
                        className="bg-zinc-900 hover:bg-[#dd1515] text-white text-[10px] font-extrabold uppercase tracking-wider px-4 py-2.5 rounded-sm transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Player
                      </button>
                    )}
                  </div>

                  {/* EDIT METADATA FORM CONTAINER */}
                  {isPlayerOwner && isEditingMetadata && (
                    <div className="mt-4 pt-4 border-t border-zinc-200 bg-zinc-50 p-5 rounded-sm space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-black text-zinc-900 uppercase text-[11px] tracking-wide">
                            Update Player Metadata (updatePlayerMetadata)
                          </h4>
                          <p className="text-zinc-500 text-[11px] mt-0.5">
                            Modify player details on-chain via the PlayerRegistry smart contract.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingMetadata(false)}
                          className="text-zinc-400 hover:text-zinc-600 font-bold text-xs"
                        >
                          ✕ Cancel
                        </button>
                      </div>

                      <form onSubmit={handleUpdatePlayerMetadata} className="space-y-4">
                        <div className="flex items-center gap-2 pb-1">
                          <label className="text-[10px] text-zinc-600 font-bold cursor-pointer flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={useDirectURI}
                              onChange={(e) => setUseDirectURI(e.target.checked)}
                              className="rounded text-[#dd1515] focus:ring-[#dd1515]"
                            />
                            Use Direct Metadata IPFS URI (Advanced)
                          </label>
                        </div>

                        {useDirectURI ? (
                          <div>
                            <label className="text-zinc-500 block font-bold text-[9px] uppercase pb-1">
                              Custom Metadata URI (e.g. ipfs://Qm...)
                            </label>
                            <input
                              type="text"
                              required
                              value={editMetadataURI}
                              onChange={(e) => setEditMetadataURI(e.target.value)}
                              placeholder="ipfs://Qm..."
                              className="bg-white border border-zinc-300 text-xs px-3 py-2.5 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono font-bold"
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-zinc-500 block font-bold text-[9px] uppercase pb-1">Player Name</label>
                              <input
                                type="text"
                                required
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Full Name"
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-500 block font-bold text-[9px] uppercase pb-1">Position</label>
                              <select
                                value={editPosition}
                                onChange={(e) => setEditPosition(e.target.value)}
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-bold"
                              >
                                <option value="Goalkeeper (GK)">Goalkeeper (GK)</option>
                                <option value="Centre-Back (CB)">Centre-Back (CB)</option>
                                <option value="Left-Back (LB)">Left-Back (LB)</option>
                                <option value="Right-Back (RB)">Right-Back (RB)</option>
                                <option value="Defensive Midfield (CDM)">Defensive Midfield (CDM)</option>
                                <option value="Central Midfield (CM)">Central Midfield (CM)</option>
                                <option value="Attacking Midfield (CAM)">Attacking Midfield (CAM)</option>
                                <option value="Left Wing (LW)">Left Wing (LW)</option>
                                <option value="Right Wing (RW)">Right Wing (RW)</option>
                                <option value="Striker (ST)">Striker (ST)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-zinc-500 block font-bold text-[9px] uppercase pb-1">Age</label>
                              <input
                                type="number"
                                required
                                value={editAge}
                                onChange={(e) => setEditAge(e.target.value)}
                                placeholder="Age in years"
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-bold"
                              />
                            </div>
                            <div>
                              <label className="text-zinc-500 block font-bold text-[9px] uppercase pb-1">Nationality</label>
                              <input
                                type="text"
                                required
                                value={editNationality}
                                onChange={(e) => setEditNationality(e.target.value)}
                                placeholder="e.g. England, Argentina"
                                className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-bold"
                              />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                              <label className="text-zinc-500 block font-bold text-[9px] uppercase">
                                Player Portrait / Image
                              </label>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {/* Image Preview Thumbnail */}
                                <div className="w-16 h-16 bg-zinc-200 border border-zinc-300 rounded-sm overflow-hidden shrink-0 relative">
                                  {editImageURI ? (
                                    <img
                                      src={editImageURI}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-400 text-[9px] font-bold">
                                      No Image
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <label className="bg-zinc-900 hover:bg-[#dd1515] text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-2 rounded-sm cursor-pointer transition-colors inline-flex items-center gap-1.5 shrink-0">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                      </svg>
                                      Upload New Image File
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageUpload}
                                        disabled={uploadingImage}
                                        className="hidden"
                                      />
                                    </label>
                                    {uploadingImage && (
                                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 animate-pulse">
                                        <div className="w-3 h-3 border-2 border-zinc-400 border-t-[#dd1515] rounded-full animate-spin" />
                                        Uploading to IPFS...
                                      </span>
                                    )}
                                  </div>

                                  <input
                                    type="text"
                                    required
                                    value={editImageURI}
                                    onChange={(e) => setEditImageURI(e.target.value)}
                                    placeholder="https://... or ipfs://..."
                                    className="bg-white border border-zinc-300 text-xs px-3 py-2 text-zinc-800 w-full focus:outline-none focus:border-[#dd1515] font-mono text-[11px]"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingMetadata(false)}
                            className="bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-sm transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={updatingMetadata}
                            className="bg-[#dd1515] hover:bg-zinc-900 text-white font-extrabold text-[10px] uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors flex items-center gap-2"
                          >
                            {updatingMetadata ? (
                              <>
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                Updating On-Chain...
                              </>
                            ) : (
                              "Save & Update PlayerMetadata"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
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

                                  {/* ESCROW SETTLEMENT SECTION (Escrow.sol) */}
                                  <div className="mt-3 pt-3 border-t border-zinc-200 space-y-3">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                      <span className="font-extrabold text-[10px] text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                                        🔒 Escrow Settlement
                                      </span>
                                      {agreement.deposits && agreement.deposits.length > 0 ? (
                                        <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded">
                                          On-Chain Escrow Deposit Active ({agreement.deposits.length})
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-mono text-zinc-400 uppercase">
                                          No On-Chain Escrow Deposit Found
                                        </span>
                                      )}
                                    </div>

                                    {/* Display Existing Escrow Deposits fetched via getDeposit */}
                                    {agreement.deposits && agreement.deposits.length > 0 && (
                                      <div className="space-y-2">
                                        {agreement.deposits.map((dep) => {
                                          const isDepPayer = walletAddress && walletAddress.toLowerCase() === dep.payer.toLowerCase();
                                          const isDepPayee = walletAddress && walletAddress.toLowerCase() === dep.payee.toLowerCase();

                                          const depStatusLabel = 
                                            dep.status === 0 ? "Created" :
                                            dep.status === 1 ? "Funded (Escrow Active)" :
                                            dep.status === 2 ? "Released (Withdrawn)" :
                                            dep.status === 3 ? "Refunded" : "Disputed";

                                          const depStatusBadge = 
                                            dep.status === 1 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-bold" :
                                            dep.status === 2 ? "bg-blue-500/10 text-blue-600 border border-blue-500/30 font-bold" :
                                            dep.status === 3 ? "bg-amber-500/10 text-amber-600 border border-amber-500/30 font-bold" :
                                            "bg-zinc-500/10 text-zinc-600 border border-zinc-500/30";

                                          return (
                                            <div key={dep.id} className="bg-white border border-zinc-200 p-3.5 rounded-sm space-y-2 text-xs shadow-sm">
                                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                                <span className="font-mono text-zinc-800 font-extrabold text-[11px]">
                                                  Deposit #{dep.id} — {Number(dep.amount).toLocaleString()} USDC
                                                </span>
                                                <span className={`text-[9px] uppercase px-2 py-0.5 rounded ${depStatusBadge}`}>
                                                  {depStatusLabel}
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-150">
                                                <div><span className="text-zinc-400 uppercase font-bold">Payer:</span> {dep.payer.substring(0, 8)}...{dep.payer.substring(dep.payer.length - 6)}</div>
                                                <div><span className="text-zinc-400 uppercase font-bold">Payee:</span> {dep.payee.substring(0, 8)}...{dep.payee.substring(dep.payee.length - 6)}</div>
                                              </div>

                                              {/* Action Buttons for Funded Escrow Deposit */}
                                              {dep.status === 1 && (
                                                <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-150">
                                                  {/* Seller / Payee withdraw (release) button */}
                                                  {isDepPayee && (
                                                    <button
                                                      onClick={() => handleEscrowRelease(dep.id)}
                                                      disabled={releasingDepositId === dep.id}
                                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5"
                                                    >
                                                      {releasingDepositId === dep.id ? (
                                                        <>
                                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                          Withdrawing...
                                                        </>
                                                      ) : (
                                                        "💸 Withdraw / Release Funds"
                                                      )}
                                                    </button>
                                                  )}

                                                  {/* Buyer / Payer refund button */}
                                                  {isDepPayer && (
                                                    <button
                                                      onClick={() => handleEscrowRefund(dep.id)}
                                                      disabled={refundingDepositId === dep.id}
                                                      className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5"
                                                    >
                                                      {refundingDepositId === dep.id ? (
                                                        <>
                                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                          Refunding...
                                                        </>
                                                      ) : (
                                                        "↩ Request Refund"
                                                      )}
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {/* Action to create and fund a new Escrow deposit */}
                                    <div className="pt-1">
                                      <button
                                        onClick={() => handleEscrowDeposit(agreement.id, agreement.seller, agreement.clauses.transferFee)}
                                        disabled={depositingAgreementId === agreement.id}
                                        className="bg-zinc-900 hover:bg-[#dd1515] text-white font-extrabold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-sm transition-colors flex items-center gap-1.5 w-full justify-center"
                                      >
                                        {depositingAgreementId === agreement.id ? (
                                          <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Funding Escrow Deposit...
                                          </>
                                        ) : (
                                          `📥 Deposit ${Number(agreement.clauses.transferFee).toLocaleString()} USDC to Escrow`
                                        )}
                                      </button>
                                    </div>
                                  </div>
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
