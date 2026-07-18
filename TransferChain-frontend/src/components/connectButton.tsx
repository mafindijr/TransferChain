"use client";

import React from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";

export default function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    const formattedAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    return (
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:inline bg-[#f2f3f5] px-3 py-2 text-xs font-mono font-bold border border-zinc-200 text-zinc-700">
          {formattedAddress}
        </span>
        <button
          id="wallet-disconnect-btn"
          onClick={() => disconnect()}
          className="bg-[#dd1515] hover:bg-[#b00f0f] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      id="wallet-connect-btn"
      onClick={() => open()}
      className="bg-[#111111] hover:bg-[#dd1515] text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
    >
      Connect Wallet
    </button>
  );
}