import { ethers } from "ethers";
import type { ChainDeployment, DeploymentManifest } from "../types/deployment.js";
import type { ProviderManager } from "./provider-manager.js";
import type { SignerManager } from "./signer-manager.js";
import type { Logger } from "../logger/types.js";
import { resolveDeploymentAddress } from "./config-validator.js";
import { ValidationError } from "../errors/validation-error.js";
import { SdkErrorCode } from "../errors/codes.js";

/**
 * Resolves contract addresses from the deployment manifest and caches
 * `ethers.Contract` instances for both read-only (provider-attached)
 * and write (signer-attached) access.
 *
 * This is an internal service — domain clients use it to obtain typed
 * contract handles without managing addresses or ABI imports themselves.
 *
 * Read-only and signer-attached contract instances are cached
 * separately because ethers.js v6 contracts are immutable once bound
 * to a provider or signer.
 */
export class ContractRegistry {
  private readonly readCache = new Map<string, ethers.Contract>();
  private readonly writeCache = new Map<string, ethers.Contract>();
  private readonly deployment: DeploymentManifest;
  private readonly chainId: number;
  private readonly providerManager: ProviderManager;
  private readonly signerManager: SignerManager;
  private readonly logger: Logger;

  constructor(
    chainId: number,
    deployment: DeploymentManifest,
    providerManager: ProviderManager,
    signerManager: SignerManager,
    logger: Logger,
  ) {
    this.chainId = chainId;
    this.deployment = deployment;
    this.providerManager = providerManager;
    this.signerManager = signerManager;
    this.logger = logger;
  }

  /**
   * Get a read-only contract instance (bound to the provider).
   *
   * @param contractName - The contract key in the deployment manifest
   *   (e.g. `"playerRegistry"`).
   * @param abi - The contract ABI array.
   * @returns A cached `ethers.Contract` bound to the read-only provider.
   */
  getReadContract(
    contractName: keyof ChainDeployment,
    abi: ethers.InterfaceAbi,
  ): ethers.Contract {
    const cacheKey = `${this.chainId}:${contractName}:read`;

    const cached = this.readCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const address = resolveDeploymentAddress(
      this.chainId,
      contractName,
      this.deployment,
    );
    const provider = this.providerManager.getProvider();
    const contract = new ethers.Contract(address, abi, provider);

    this.readCache.set(cacheKey, contract);

    this.logger.debug("Read-only contract cached", {
      contractName,
      chainId: this.chainId,
    });

    return contract;
  }

  /**
   * Get a signer-attached contract instance (for write operations).
   *
   * @param contractName - The contract key in the deployment manifest.
   * @param abi - The contract ABI array.
   * @returns A cached `ethers.Contract` bound to the active signer.
   * @throws {ValidationError} With code `SIGNER_REQUIRED` if no signer
   *   is available.
   */
  getWriteContract(
    contractName: keyof ChainDeployment,
    abi: ethers.InterfaceAbi,
  ): ethers.Contract {
    const signer = this.signerManager.getSigner();
    if (signer === undefined) {
      throw new ValidationError(
        SdkErrorCode.SIGNER_REQUIRED,
        "A signer is required for write operations",
      );
    }

    const cacheKey = `${this.chainId}:${contractName}:write`;

    const cached = this.writeCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const address = resolveDeploymentAddress(
      this.chainId,
      contractName,
      this.deployment,
    );
    const contract = new ethers.Contract(address, abi, signer);

    this.writeCache.set(cacheKey, contract);

    this.logger.debug("Write contract cached", {
      contractName,
      chainId: this.chainId,
    });

    return contract;
  }

  /**
   * Resolve the on-chain address for a contract on the current chain.
   *
   * @param contractName - The contract key in the deployment manifest.
   * @returns The checksummed contract address.
   * @throws {ValidationError} With code `CHAIN_NOT_SUPPORTED` if the
   *   chain has no deployment for the requested contract.
   */
  getAddress(contractName: keyof ChainDeployment): string {
    return resolveDeploymentAddress(
      this.chainId,
      contractName,
      this.deployment,
    );
  }
}
