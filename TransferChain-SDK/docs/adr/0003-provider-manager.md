# ADR-0003: Provider Manager Pattern

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The SDK needs to manage JSON-RPC providers across multiple chains, validate connectivity, and avoid creating duplicate provider instances for the same RPC endpoint. Individual domain clients could create their own providers, but this would scatter provider lifecycle management across the codebase.

## Decision

Centralize provider creation, caching, and validation in a `ProviderManager` service. Providers are cached by `(chainId, rpcUrl)` tuple and never evicted. Validation (chain ID check, connectivity check) is deferred to first use, not construction.

## Consequences

**Positive:**

- Single point of control for all RPC connections
- Duplicate provider instances eliminated
- Chain validation is consistent across all clients
- Easy to swap or mock providers for testing

**Negative:**

- All clients share the same provider for a given chain (cannot mix RPC endpoints per domain)
- Provider cache never evicts (memory usage is bounded but not configurable)
