import type { SdkConfig } from "../types/config.js";
import type { Logger } from "../logger/types.js";
import { silentLogger } from "../logger/silent-logger.js";
import { validateConfig } from "./config-validator.js";
import { ProviderManager } from "./provider-manager.js";
import { SignerManager } from "./signer-manager.js";
import { ContractRegistry } from "./contract-registry.js";
import { TransactionManager } from "./transaction-manager.js";
import { BUILTIN_MANIFEST } from "../constants/manifest.js";
import { AccessControlClient } from "../contracts/access-control-client.js";
import { ConfigClient } from "../contracts/config-client.js";
import { PlayerRegistryClient } from "../contracts/player-registry-client.js";
import { ClubRegistryClient } from "../contracts/club-registry-client.js";

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
 * const paused = await tc.accessControl.isPaused();
 * const treasury = await tc.config.getTreasury();
 * ```
 */
export class TransferChain {
  /** The configured chain ID. */
  readonly chainId: number;

  /** Access control: roles, pause/unpause. */
  readonly accessControl: AccessControlClient;

  /** Protocol configuration: treasury, fees, tokens, emergency mode. */
  readonly config: ConfigClient;

  /** Player entity management: registration, metadata, status. */
  readonly players: PlayerRegistryClient;

  /** Club entity management: registration, metadata, status. */
  readonly clubs: ClubRegistryClient;

  private readonly logger: Logger;
  private readonly providerManager: ProviderManager;
  private readonly signerManager: SignerManager;
  private readonly registry: ContractRegistry;
  private readonly transactionManager: TransactionManager;
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
    this.registry = new ContractRegistry(
      config.chainId,
      deployment,
      this.providerManager,
      this.signerManager,
      this.logger,
    );

    this.transactionManager = new TransactionManager(
      this.registry,
      this.logger,
    );

    this.accessControl = new AccessControlClient(
      this.registry,
      this.transactionManager,
    );

    this.config = new ConfigClient(
      this.registry,
      this.transactionManager,
    );

    this.players = new PlayerRegistryClient(
      this.registry,
      this.transactionManager,
    );

    this.clubs = new ClubRegistryClient(
      this.registry,
      this.transactionManager,
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

  /**
   * @internal Access the contract registry for domain clients.
   * Not part of the public API — may change without notice.
   */
  getRegistry(): ContractRegistry {
    this.assertNotDestroyed();
    return this.registry;
  }

  private assertNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error("TransferChain instance has been destroyed");
    }
  }
}
