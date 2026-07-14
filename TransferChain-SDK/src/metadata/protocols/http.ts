import type { MetadataContent, ProtocolHandler, ResolveOptions } from "../../types/metadata.js";

/**
 * Resolves `http://` and `https://` URIs via standard HTTP fetch.
 *
 * Default timeout: 10,000 ms
 * Default retry: 1 attempt on network error
 */
export class HttpProtocol implements ProtocolHandler {
  readonly scheme: string;
  private readonly defaultTimeout: number;
  private readonly maxRetries: number;

  constructor(options?: { scheme?: string; timeout?: number; maxRetries?: number }) {
    this.scheme = options?.scheme ?? "https";
    this.defaultTimeout = options?.timeout ?? 10_000;
    this.maxRetries = options?.maxRetries ?? 1;
  }

  async resolve(uri: string, options?: ResolveOptions): Promise<MetadataContent> {
    const timeout = options?.timeout ?? this.defaultTimeout;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(uri, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`HTTP fetch failed: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const data = JSON.parse(text) as Record<string, unknown>;
        const hash = await sha256(text);

        return { data, resolvedUrl: response.url ?? uri, hash };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      } finally {
        clearTimeout(timer);
      }
    }

    throw lastError;
  }
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
