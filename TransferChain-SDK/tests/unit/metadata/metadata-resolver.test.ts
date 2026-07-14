import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MetadataResolver } from "../../../src/metadata/metadata-resolver.js";
import { IpfsProtocol } from "../../../src/metadata/protocols/ipfs.js";
import { HttpProtocol } from "../../../src/metadata/protocols/http.js";

function mockFetch(data: Record<string, unknown>, status = 200) {
  const text = JSON.stringify(data);
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    text: () => Promise.resolve(text),
    url: "https://resolved.example.com/meta.json",
  };
  return vi.fn().mockResolvedValue(response);
}

describe("MetadataResolver", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("resolves via registered handler", async () => {
    const handler = {
      scheme: "custom",
      resolve: vi.fn().mockResolvedValue({
        data: { name: "Test" },
        resolvedUrl: "custom://test",
        hash: "abc",
      }),
    };
    const resolver = new MetadataResolver({ protocols: [handler] });
    const result = await resolver.resolve<Record<string, unknown>>("custom://test");

    expect(result).toEqual({ name: "Test" });
    expect(handler.resolve).toHaveBeenCalledOnce();
  });

  it("throws for unknown scheme", async () => {
    const resolver = new MetadataResolver();
    await expect(resolver.resolve("unknown://uri")).rejects.toThrow(
      'No handler registered for scheme "unknown"',
    );
  });

  it("throws for URI without scheme", async () => {
    const resolver = new MetadataResolver();
    await expect(resolver.resolve("no-scheme-here")).rejects.toThrow(
      "Invalid URI: missing scheme",
    );
  });

  it("caches results and returns cached on second call", async () => {
    const handler = {
      scheme: "cached",
      resolve: vi.fn().mockResolvedValue({
        data: { name: "Cached" },
        resolvedUrl: "cached://test",
        hash: "hash1",
      }),
    };
    const resolver = new MetadataResolver({ protocols: [handler] });

    const first = await resolver.resolve("cached://test");
    const second = await resolver.resolve("cached://test");

    expect(first).toEqual({ name: "Cached" });
    expect(second).toEqual({ name: "Cached" });
    expect(handler.resolve).toHaveBeenCalledOnce();
  });

  it("skipCache bypasses cache", async () => {
    const handler = {
      scheme: "fresh",
      resolve: vi.fn().mockResolvedValue({
        data: { name: "Fresh" },
        resolvedUrl: "fresh://test",
        hash: "hash1",
      }),
    };
    const resolver = new MetadataResolver({ protocols: [handler] });

    await resolver.resolve("fresh://test");
    await resolver.resolve("fresh://test", { skipCache: true });

    expect(handler.resolve).toHaveBeenCalledTimes(2);
  });

  it("clearCache removes all cached entries", async () => {
    const handler = {
      scheme: "cc",
      resolve: vi.fn().mockResolvedValue({
        data: { name: "CC" },
        resolvedUrl: "cc://test",
        hash: "hash1",
      }),
    };
    const resolver = new MetadataResolver({ protocols: [handler] });

    await resolver.resolve("cc://test");
    resolver.clearCache();
    await resolver.resolve("cc://test");

    expect(handler.resolve).toHaveBeenCalledTimes(2);
  });

  it("evicts oldest entry when cache is full", async () => {
    const handler = {
      scheme: "lru",
      resolve: vi.fn().mockImplementation(async (uri: string) => ({
        data: { name: uri },
        resolvedUrl: uri,
        hash: "h",
      })),
    };
    const resolver = new MetadataResolver({ protocols: [handler], cacheMaxSize: 2 });

    await resolver.resolve("lru://a");
    await resolver.resolve("lru://b");
    await resolver.resolve("lru://c");

    await resolver.resolve("lru://a");
    await resolver.resolve("lru://b");

    expect(handler.resolve).toHaveBeenCalledTimes(5);
  });

  it("resolvePlayer returns typed profile", async () => {
    const handler = {
      scheme: "player",
      resolve: vi.fn().mockResolvedValue({
        data: { name: "Alice", position: "striker" },
        resolvedUrl: "player://meta",
        hash: "h",
      }),
    };
    const resolver = new MetadataResolver({ protocols: [handler] });
    const profile = await resolver.resolvePlayer("player://meta");

    expect(profile.name).toBe("Alice");
    expect(profile.position).toBe("striker");
  });

  it("resolveClub returns typed profile", async () => {
    const handler = {
      scheme: "club",
      resolve: vi.fn().mockResolvedValue({
        data: { name: "FC Test", country: "DE" },
        resolvedUrl: "club://meta",
        hash: "h",
      }),
    };
    const resolver = new MetadataResolver({ protocols: [handler] });
    const profile = await resolver.resolveClub("club://meta");

    expect(profile.name).toBe("FC Test");
    expect(profile.country).toBe("DE");
  });

  it("registerHandler replaces existing handler for same scheme", async () => {
    const handler1 = {
      scheme: "dup",
      resolve: vi.fn().mockResolvedValue({
        data: { v: 1 },
        resolvedUrl: "dup://",
        hash: "h",
      }),
    };
    const handler2 = {
      scheme: "dup",
      resolve: vi.fn().mockResolvedValue({
        data: { v: 2 },
        resolvedUrl: "dup://",
        hash: "h",
      }),
    };
    const resolver = new MetadataResolver({ protocols: [handler1] });
    resolver.registerHandler(handler2);

    const result = await resolver.resolve("dup://x");
    expect(result).toEqual({ v: 2 });
    expect(handler1.resolve).not.toHaveBeenCalled();
    expect(handler2.resolve).toHaveBeenCalledOnce();
  });
});

describe("IpfsProtocol", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("resolves ipfs:// URI via gateway", async () => {
    const data = { name: "Player1" };
    globalThis.fetch = mockFetch(data);

    const protocol = new IpfsProtocol();
    const result = await protocol.resolve("ipfs://QmHash123");

    expect(result.data).toEqual(data);
    expect(result.resolvedUrl).toBe("https://ipfs.io/ipfs/QmHash123");
    expect(result.hash).toBeTruthy();
  });

  it("uses custom gateway", async () => {
    const data = { name: "Test" };
    globalThis.fetch = mockFetch(data);

    const protocol = new IpfsProtocol({ gateway: "https://gateway.example.com/ipfs/" });
    const result = await protocol.resolve("ipfs://QmABC");

    expect(result.resolvedUrl).toBe("https://gateway.example.com/ipfs/QmABC");
  });

  it("throws on invalid IPFS URI (empty CID)", async () => {
    const protocol = new IpfsProtocol();
    await expect(protocol.resolve("ipfs://")).rejects.toThrow("Invalid IPFS URI");
  });

  it("throws on HTTP error", async () => {
    globalThis.fetch = mockFetch({}, 404);

    const protocol = new IpfsProtocol();
    await expect(protocol.resolve("ipfs://QmNotFound")).rejects.toThrow("IPFS fetch failed");
  });
});

describe("HttpProtocol", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("resolves https URI", async () => {
    const data = { name: "Test" };
    globalThis.fetch = mockFetch(data);

    const protocol = new HttpProtocol({ scheme: "https" });
    const result = await protocol.resolve("https://example.com/meta.json");

    expect(result.data).toEqual(data);
    expect(result.hash).toBeTruthy();
  });

  it("throws on HTTP error", async () => {
    globalThis.fetch = mockFetch({}, 500);

    const protocol = new HttpProtocol({ scheme: "https" });
    await expect(protocol.resolve("https://example.com/fail")).rejects.toThrow(
      "HTTP fetch failed",
    );
  });

  it("retries on network error", async () => {
    const failFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
        url: "https://example.com/retry",
      });

    globalThis.fetch = failFetch;

    const protocol = new HttpProtocol({ scheme: "https", maxRetries: 1 });
    const result = await protocol.resolve("https://example.com/retry");

    expect(result.data).toEqual({ ok: true });
    expect(failFetch).toHaveBeenCalledTimes(2);
  });
});
