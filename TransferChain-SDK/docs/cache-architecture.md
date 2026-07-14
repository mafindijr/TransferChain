# Cache Architecture

## Table of Contents

- [Cache Layers](#cache-layers)
- [Provider Cache](#provider-cache)
- [Contract Cache](#contract-cache)
- [Metadata Cache](#metadata-cache)
- [Design Principles](#design-principles)
- [Cache Bypass](#cache-bypass)

---

## Cache Layers

| Layer | Scope | What | TTL | Eviction | Max Size |
|-------|-------|------|-----|----------|----------|
| Provider | Process-wide | `JsonRpcProvider` instances | Never | None | Unbounded |
| Contract | Per instance | `ethers.Contract` instances | Never | None | Unbounded |
| Metadata | Per instance | Resolved metadata by URI | 5 minutes | LRU | 1000 entries |

---

## Provider Cache

### Key

`${chainId}:${rpcUrl}`

### Behavior

- Providers are cached on first creation
- The same RPC endpoint shared across multiple `TransferChain` instances uses one provider
- Providers are never evicted (see [ADR-0003](./adr/0003-provider-manager.md))

### Why Never Evict

- Providers are lightweight wrappers around HTTP connections
- HTTP connections are pooled by the runtime
- Evicting a provider does not close its connections
- Re-creating for the same endpoint provides no benefit

---

## Contract Cache

### Key

`${chainId}:${contractAddress}:${signerRole}`

Where `signerRole` is `"read"` or `"write"`.

### Behavior

- Contracts are cached on first access
- Read and write instances are cached separately (ethers.js v6 immutability)
- Contracts are never evicted (see [ADR-0009](./adr/0009-contract-registry-caching.md))

### Why Separate Read/Write

ethers.js v6 contracts are immutable — a contract bound to a `Provider` cannot have transactions sent through it, and a contract bound to a `Signer` cannot make `eth_call` reads. The SDK maintains both variants:

```
Read contract:  new ethers.Contract(address, abi, provider)
Write contract: new ethers.Contract(address, abi, signer)
```

---

## Metadata Cache

### Key

The raw URI string (e.g., `ipfs://QmHash...`).

### Properties

| Property | Default | Configurable |
|----------|---------|-------------|
| TTL | 300,000ms (5 min) | Yes, via `metadata.cacheTtl` |
| Max entries | 1000 | Yes, via `metadata.cacheMaxSize` |
| Eviction | LRU | Fixed |

### Why Metadata Is Cached

- IPFS gateways have rate limits and high latency (500ms+)
- Off-chain metadata changes infrequently
- Caching avoids redundant fetches for the same URI

### Why Contract Reads Are Not Cached

- On-chain state changes with every block
- Caching would risk stale data for financial operations
- RPC latency is acceptable (50-200ms)

See [ADR-0005](./adr/0005-no-query-result-caching.md) for the full rationale.

---

## Design Principles

### 1. In-Memory Only

All caches are in-memory. No disk persistence, no Redis, no external cache store. Each `TransferChain` instance starts cold.

### 2. No Query Result Caching

Contract read results (`getPlayer()`, `getListing()`, etc.) are never cached. Every read hits the RPC.

### 3. Predictable Memory

Cache memory usage is bounded by:
- Providers: one per unique RPC endpoint
- Contracts: one per `(chain, address, role)` tuple
- Metadata: max 1000 entries with LRU eviction

### 4. No Cache Invalidation

There is no cache invalidation logic. Provider and contract caches never expire. Metadata cache expires via TTL.

---

## Cache Bypass

Skip the metadata cache when freshness is critical:

```typescript
const profile = await tc.metadata.resolvePlayer("ipfs://Qm...", {
  skipCache: true,
});
```

There is no cache bypass for provider or contract caches (they never expire, so bypass is not meaningful).
