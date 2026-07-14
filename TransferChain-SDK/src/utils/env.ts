import type { SdkConfig } from "../types/config.js";

export function fromEnv(): SdkConfig {
  const chainId = process.env.TRANSFERCHAIN_CHAIN_ID;
  const rpcUrl = process.env.TRANSFERCHAIN_RPC_URL;
  const privateKey = process.env.TRANSFERCHAIN_PRIVATE_KEY;

  if (chainId === undefined) {
    throw new Error("TRANSFERCHAIN_CHAIN_ID environment variable is required");
  }

  if (rpcUrl === undefined) {
    throw new Error("TRANSFERCHAIN_RPC_URL environment variable is required");
  }

  const parsed = Number.parseInt(chainId, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(
      `TRANSFERCHAIN_CHAIN_ID must be a valid integer, received: "${chainId}"`,
    );
  }

  return {
    chainId: parsed,
    rpcUrl,
    privateKey: privateKey ?? undefined,
  };
}
