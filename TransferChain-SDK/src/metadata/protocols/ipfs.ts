import type { MetadataContent, ProtocolHandler, ResolveOptions } from "../../types/metadata.js";

/**
 * Resolves `ipfs://` URIs by delegating to a configurable IPFS gateway.
 *
 * Default gateway: `https://ipfs.io/ipfs/`
 * Default timeout: 10,000 ms
 */
export class IpfsProtocol implements ProtocolHandler {
  readonly scheme = "ipfs";

  private readonly gateway: string;
  private readonly defaultTimeout: number;

  constructor(options?: { gateway?: string; timeout?: number }) {
    this.gateway = options?.gateway ?? "https://ipfs.io/ipfs/";
    this.defaultTimeout = options?.timeout ?? 10_000;
  }

  async resolve(uri: string, options?: ResolveOptions): Promise<MetadataContent> {
    const cid = uri.replace(/^ipfs:\/\//, "").replace(/\/+$/, "");

    if (!cid) {
      throw new Error(`Invalid IPFS URI: ${uri}`);
    }

    const resolvedUrl = `${this.gateway}${cid}`;
    const timeout = options?.timeout ?? this.defaultTimeout;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(resolvedUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`IPFS fetch failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const data = JSON.parse(text) as Record<string, unknown>;
      const hash = await sha256(text);

      return { data, resolvedUrl, hash };
    } finally {
      clearTimeout(timer);
    }
  }
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
