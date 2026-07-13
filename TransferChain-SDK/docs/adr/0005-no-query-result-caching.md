# ADR-0005: No Query Result Caching

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Contract read results (e.g., `getPlayer()`, `getListing()`) could be cached to reduce RPC calls and improve latency. However, on-chain state changes with every block, and cached read results can become stale within seconds. The tradeoff is between performance and correctness.

## Decision

Contract read results are never cached. Every read call hits the RPC endpoint. The only cached layer is off-chain metadata (IPFS/HTTP), which has a configurable TTL and LRU eviction. This separates caching where it provides value (slow, rate-limited IPFS gateways) from where it introduces risk (real-time on-chain state).

## Consequences

**Positive:**

- Consumers always see the latest on-chain state
- No stale data bugs from expired cache entries
- Simplified implementation (no invalidation logic)
- Correctness by default for financial operations

**Negative:**

- Every read call incurs RPC latency (typically 50-200ms)
- Higher RPC usage for read-heavy applications
- Applications that need performance must implement their own caching layer
