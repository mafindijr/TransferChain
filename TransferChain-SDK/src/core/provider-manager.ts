import { ethers } from "ethers";
import type { SdkConfig } from "../types/config.js";
import type { Logger } from "../logger/types.js";
import { ProviderError } from "../errors/provider-error.js";
import { ChainMismatchError } from "../errors/chain-mismatch-error.js";
import { SdkErrorCode } from "../errors/codes.js";

/**
 * Centralizes provider lifecycle management. Internal service — consumers
 * do not interact with it directly.
 *
 * Providers are cached by composite key `${chainId}:${rpcUrl}` and never
 * evicted, because they are stateless wrappers around pooled HTTP
 * connections.
 *
 * Validation is deferred to first use (not construction) so the SDK
 * initializer stays synchronous and fast.
 */
export class ProviderManager {
  private readonly cache = new Map<string, ethers.Provider>();
  private readonly logger: Logger;
  private readonly chainId: number;

  /** Pre-built provider from config, if supplied by the consumer. */
  private readonly externalProvider?: ethers.Provider;

  /** RPC URL from config, used to create a JsonRpcProvider when no
   * external provider is supplied. */
  private readonly rpcUrl?: string;

  constructor(config: SdkConfig, logger: Logger) {
    this.logger = logger;
    this.chainId = config.chainId;
    this.externalProvider = config.provider;
    this.rpcUrl = config.rpcUrl;
  }

  /**
   * Get or create a provider for the configured chain.
   *
   * If the consumer supplied a pre-built `provider` in config, it is
   * returned directly (and cached for consistency). Otherwise a
   * `JsonRpcProvider` is created from `rpcUrl`.
   *
   * @returns The ethers.js Provider instance for the configured chain.
   */
  getProvider(): ethers.Provider {
    const cacheKey = this.getCacheKey(this.chainId, this.rpcUrl ?? "external");

    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    let provider: ethers.Provider;

    if (this.externalProvider !== undefined) {
      provider = this.externalProvider;
    } else if (this.rpcUrl !== undefined) {
      provider = new ethers.JsonRpcProvider(this.rpcUrl, this.chainId);
    } else {
      throw new ProviderError(
        SdkErrorCode.CONNECTION_FAILED,
        "No provider or rpcUrl configured",
      );
    }

    this.cache.set(cacheKey, provider);

    this.logger.debug("Provider created", {
      chainId: this.chainId,
      rpcUrl: this.rpcUrl !== undefined ? this.redactUrl(this.rpcUrl) : "external",
    });

    return provider;
  }

  /**
   * Manually register a provider instance for the configured chain.
   * Useful for testing or when the consumer provides a custom provider
   * after construction.
   *
   * @param provider - The ethers.js Provider instance to cache.
   */
  setProvider(provider: ethers.Provider): void {
    const cacheKey = this.getCacheKey(this.chainId, "manual");
    this.cache.set(cacheKey, provider);

    this.logger.debug("Provider registered manually", {
      chainId: this.chainId,
    });
  }

  /**
   * Verify that the provider's chain ID matches the configured chain ID.
   *
   * This is called lazily on first use, not at construction time.
   *
   * @throws {ProviderError} With code `CHAIN_MISMATCH` if the chain IDs
   *   do not match.
   */
  async validateChainId(): Promise<void> {
    const provider = this.getProvider();
    const network = await provider.getNetwork();
    const actualChainId = Number(network.chainId);

    if (actualChainId !== this.chainId) {
      throw new ChainMismatchError(this.chainId, actualChainId);
    }
  }

  private getCacheKey(chainId: number, url: string): string {
    return `${chainId}:${url}`;
  }

  private redactUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = "***";
      }
      return parsed.toString();
    } catch {
      return "***";
    }
  }
}
