import type { ethers } from "ethers";
import type { DeploymentManifest } from "./deployment.js";
import type { Logger } from "../logger/types.js";
import type { MetadataConfig } from "./metadata.js";
import type { TransactionDefaults } from "./transaction.js";

export interface SdkConfig {
  chainId: number;
  rpcUrl: string;
  privateKey?: string;
  signer?: ethers.Signer;
  provider?: ethers.Provider;
  deployment?: DeploymentManifest;
  logger?: Logger;
  metadata?: MetadataConfig;
  transactions?: TransactionDefaults;
}
