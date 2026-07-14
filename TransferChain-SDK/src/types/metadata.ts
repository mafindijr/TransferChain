/**
 * Resolves a URI scheme to its content. Protocol handlers are
 * registered with {@link MetadataResolver} and matched by URI scheme.
 */
export interface ProtocolHandler {
  /** The URI scheme this handler supports (e.g. "ipfs", "https"). */
  readonly scheme: string;

  /** Resolve a URI to its raw content string. */
  resolve(uri: string, options?: ResolveOptions): Promise<MetadataContent>;
}

/**
 * Options for metadata resolution.
 */
export interface ResolveOptions {
  /** Skip the metadata cache. */
  skipCache?: boolean;
  /** Request timeout in milliseconds. */
  timeout?: number;
}

/**
 * The resolved content of a metadata URI.
 */
export interface MetadataContent {
  /** The parsed JSON content. */
  data: Record<string, unknown>;
  /** The final resolved URL (after redirects). */
  resolvedUrl: string;
  /** Content hash for cache keying. */
  hash: string;
}

/**
 * Player metadata profile fetched from an off-chain URI.
 */
export interface PlayerProfile {
  name: string;
  age?: number;
  nationality?: string;
  preferredFoot?: "left" | "right" | "both";
  position?: string;
  height?: number;
  currentClub?: string;
  photoUri?: string;
  highlightVideoUris?: string[];
  socialLinks?: Record<string, string>;
  achievements?: string[];
  /** Forward-compatible: additional fields are preserved. */
  [key: string]: unknown;
}

/**
 * Club metadata profile fetched from an off-chain URI.
 */
export interface ClubProfile {
  name: string;
  country?: string;
  city?: string;
  league?: string;
  logoUri?: string;
  website?: string;
  verified?: boolean;
  description?: string;
  socialLinks?: Record<string, string>;
  /** Forward-compatible: additional fields are preserved. */
  [key: string]: unknown;
}

/**
 * Configuration for the metadata resolver.
 */
export interface MetadataConfig {
  protocols?: ProtocolHandler[];
  ipfsGateway?: string;
  cacheTtl?: number;
  cacheMaxSize?: number;
}
