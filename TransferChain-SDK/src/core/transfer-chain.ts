import type { SdkConfig } from "../types/config.js";
import type { Logger } from "../logger/types.js";
import { silentLogger } from "../logger/silent-logger.js";
import { validateConfig } from "./config-validator.js";
import { ProviderManager } from "./provider-manager.js";
import { SignerManager } from "./signer-manager.js";
import { ContractRegistry } from "./contract-registry.js";
import { BUILTIN_MANIFEST } from "../constants/manifest.js";

/**
 * The single entry point for all TransferChain SDK functionality.
 *
 * All domain clients are accessible as properties. Infrastructure is
 * wired up internally and hidden from consumers.
 *
 * @example
 * ```ts
 * const tc = new TransferChain({
 *   chainId: 8888,
 *   rpcUrl: "https://evm.testnet.injective.network",
 *   privateKey: "0x...",
 * });
 *
 * const player = await tc.players.getPlayer("0xBEEF...");
 * ```
 */
export class TransferChain {
  /** The configured chain ID. */
  readonly chainId: number;

  private readonly logger: Logger;
  private readonly providerManager: ProviderManager;
  private readonly signerManager: SignerManager;
  private readonly _contractRegistry: ContractRegistry;
  private destroyed = false;

  constructor(config: SdkConfig) {
    validateConfig(config);

    this.chainId = config.chainId;
    this.logger = config.logger ?? silentLogger;

    this.providerManager = new ProviderManager(config, this.logger);
    this.signerManager = new SignerManager(
      config,
      this.providerManager,
      this.logger,
    );

    const deployment = config.deployment ?? BUILTIN_MANIFEST;
    this._contractRegistry = new ContractRegistry(
      config.chainId,
      deployment,
      this.providerManager,
      this.signerManager,
      this.logger,
    );

    this.logger.info("SDK initialized", {
      chainId: config.chainId,
    });
  }

  /**
   * Whether a signer is available for write operations.
   *
   * @returns `true` if the SDK was initialized with a signer or
   *   private key, `false` for read-only mode.
   */
  hasSigner(): boolean {
    this.assertNotDestroyed();
    return this.signerManager.hasSigner();
  }

  /**
   * Release resources held by this SDK instance.
   *
   * After calling `destroy()`, all subsequent calls to SDK methods
   * will throw.
   */
  destroy(): void {
    this.destroyed = true;
    this.logger.info("SDK destroyed");
  }

  private assertNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error("TransferChain instance has been destroyed");
    }
  }
}
