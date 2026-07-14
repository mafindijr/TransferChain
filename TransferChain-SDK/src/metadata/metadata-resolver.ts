import type {
  ClubProfile,
  MetadataContent,
  PlayerProfile,
  ProtocolHandler,
  ResolveOptions,
} from "../types/metadata.js";

interface CacheEntry {
  content: MetadataContent;
  expiresAt: number;
}

/**
 * Resolves off-chain metadata URIs into typed JavaScript objects.
 *
 * Supports pluggable protocol handlers (IPFS, HTTP, custom) and
 * includes an LRU cache with configurable TTL.
 *
 * @example
 * ```typescript
 * const resolver = new MetadataResolver();
 * const player = await resolver.resolvePlayer("ipfs://Qm...");
 * ```
 */
export class MetadataResolver {
  private readonly handlers = new Map<string, ProtocolHandler>();
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheTtl: number;
  private readonly cacheMaxSize: number;

  constructor(options?: {
    protocols?: ProtocolHandler[];
    ipfsGateway?: string;
    cacheTtl?: number;
    cacheMaxSize?: number;
  }) {
    this.cacheTtl = options?.cacheTtl ?? 5 * 60 * 1000;
    this.cacheMaxSize = options?.cacheMaxSize ?? 1000;

    if (options?.protocols) {
      for (const handler of options.protocols) {
        this.registerHandler(handler);
      }
    }
  }

  /**
   * Register a protocol handler. If a handler with the same scheme
   * already exists it is replaced.
   */
  registerHandler(handler: ProtocolHandler): void {
    this.handlers.set(handler.scheme, handler);
  }

  /**
   * Resolve a URI to a typed object. The URI scheme is extracted and
   * matched against registered protocol handlers.
   */
  async resolve<T = Record<string, unknown>>(
    uri: string,
    options?: ResolveOptions,
  ): Promise<T> {
    const scheme = this.extractScheme(uri);

    if (scheme === "ipfs" && !this.handlers.has("ipfs")) {
      throw new Error(
        `No handler registered for scheme "${scheme}". Register an IPFS handler or pass protocols in MetadataConfig.`,
      );
    }

    const handler = this.handlers.get(scheme);
    if (!handler) {
      throw new Error(`No handler registered for scheme "${scheme}".`);
    }

    if (!options?.skipCache) {
      const cached = this.cacheGet(uri);
      if (cached) {
        return cached.data as T;
      }
    }

    const content = await handler.resolve(uri, options);
    this.cacheSet(uri, content);

    return content.data as T;
  }

  /**
   * Resolve a player metadata URI into a {@link PlayerProfile}.
   */
  async resolvePlayer(uri: string, options?: ResolveOptions): Promise<PlayerProfile> {
    return this.resolve<PlayerProfile>(uri, options);
  }

  /**
   * Resolve a club metadata URI into a {@link ClubProfile}.
   */
  async resolveClub(uri: string, options?: ResolveOptions): Promise<ClubProfile> {
    return this.resolve<ClubProfile>(uri, options);
  }

  /**
   * Clear the metadata cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /** @internal */
  private extractScheme(uri: string): string {
    const colonIndex = uri.indexOf("://");
    if (colonIndex === -1) {
      throw new Error(`Invalid URI: missing scheme (expected "scheme://..."): ${uri}`);
    }
    return uri.substring(0, colonIndex).toLowerCase();
  }

  /** @internal */
  private cacheGet(uri: string): MetadataContent | undefined {
    const entry = this.cache.get(uri);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(uri);
      return undefined;
    }

    return entry.content;
  }

  /** @internal */
  private cacheSet(uri: string, content: MetadataContent): void {
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(uri, {
      content,
      expiresAt: Date.now() + this.cacheTtl,
    });
  }
}
