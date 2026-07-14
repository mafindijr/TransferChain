import { isAddress } from "ethers";
import type { SdkConfig } from "../types/config.js";
import { ValidationError } from "../errors/validation-error.js";
import { SdkErrorCode } from "../errors/codes.js";
import { BUILTIN_MANIFEST } from "../constants/manifest.js";
import type { ChainDeployment } from "../types/deployment.js";

export function validateConfig(config: SdkConfig): void {
  if (config.chainId <= 0) {
    throw new ValidationError(
      SdkErrorCode.CHAIN_NOT_SUPPORTED,
      `Chain ID must be a positive integer, received: ${config.chainId}`,
      { chainId: config.chainId },
    );
  }

  if (!config.rpcUrl || config.rpcUrl.trim().length === 0) {
    throw new ValidationError(
      SdkErrorCode.INVALID_ADDRESS,
      "rpcUrl is required and cannot be empty",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(config.rpcUrl);
  } catch {
    throw new ValidationError(
      SdkErrorCode.INVALID_ADDRESS,
      `rpcUrl is not a valid URL: "${config.rpcUrl}"`,
      { rpcUrl: config.rpcUrl },
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "ws:" && parsedUrl.protocol !== "wss:") {
    throw new ValidationError(
      SdkErrorCode.INVALID_ADDRESS,
      `rpcUrl must use http, https, ws, or wss protocol, received: "${parsedUrl.protocol}"`,
      { rpcUrl: config.rpcUrl },
    );
  }
}

export function resolveDeploymentAddress(
  chainId: number,
  contractName: keyof ChainDeployment,
  userManifest?: Record<number, ChainDeployment>,
): string {
  const userAddress = userManifest?.[chainId]?.[contractName];
  if (userAddress !== undefined) {
    return userAddress;
  }

  const builtinAddress = BUILTIN_MANIFEST[chainId]?.[contractName];
  if (builtinAddress !== undefined) {
    return builtinAddress;
  }

  throw new ValidationError(
    SdkErrorCode.CHAIN_NOT_SUPPORTED,
    `No deployment found for chain ${chainId}, contract "${contractName}"`,
    { chainId, contractName },
  );
}

export function validateAddress(
  address: string,
  fieldName: string,
): void {
  if (!isAddress(address)) {
    throw new ValidationError(
      SdkErrorCode.INVALID_ADDRESS,
      `Invalid address for ${fieldName}: "${address}"`,
      { fieldName, address },
    );
  }
}
