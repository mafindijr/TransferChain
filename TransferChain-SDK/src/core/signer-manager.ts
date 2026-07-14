import { ethers } from "ethers";
import type { SdkConfig } from "../types/config.js";
import type { ProviderManager } from "./provider-manager.js";
import type { Logger } from "../logger/types.js";

/**
 * Manages the active `ethers.Signer` instance and provides it to the
 * `ContractRegistry` and `TransactionManager` for write operations.
 *
 * When no signer is provided the SDK operates in full read-only mode:
 * all read methods work normally, all write methods throw
 * `ValidationError(SIGNER_REQUIRED)`.
 */
export class SignerManager {
  private signer?: ethers.Signer;
  private readonly logger: Logger;

  constructor(
    config: SdkConfig,
    _providerManager: ProviderManager,
    logger: Logger,
  ) {
    this.logger = logger;

    if (config.signer !== undefined) {
      // Pre-built signer takes precedence
      this.signer = config.signer;
    } else if (config.privateKey !== undefined) {
      // Create a Wallet from the private key, attached to the provider
      const provider = _providerManager.getProvider();
      this.signer = new ethers.Wallet(config.privateKey, provider);
    }

    if (this.signer !== undefined) {
      this.logger.debug("Signer initialized");
    } else {
      this.logger.debug("SDK running in read-only mode (no signer)");
    }
  }

  /**
   * Get the active signer, or `undefined` if in read-only mode.
   *
   * @returns The ethers.js Signer, or undefined.
   */
  getSigner(): ethers.Signer | undefined {
    return this.signer;
  }

  /**
   * Check whether a signer is available for write operations.
   *
   * @returns `true` if a signer is configured, `false` otherwise.
   */
  hasSigner(): boolean {
    return this.signer !== undefined;
  }
}
