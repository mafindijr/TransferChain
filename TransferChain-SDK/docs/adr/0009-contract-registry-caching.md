# ADR-0009: Contract Registry Caching

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

Every domain client method call needs an `ethers.Contract` instance. Creating a new contract instance on every call is wasteful (ABI parsing, address validation). But ethers.js v6 contracts are immutable — a contract with a signer is different from one without. The caching key must account for this.

## Decision

Contracts are cached by a composite key: `${chainId}:${contractAddress}:${signerRole}`. The `signerRole` is either `"read"` (provider only, for read methods) or `"write"` (signer attached, for write methods). Cached entries are never evicted — contract instances are immutable ABI wrappers with no lifecycle concerns.

## Consequences

**Positive:**

- Eliminates redundant contract instantiation
- Read and write contracts are properly separated (ethers.js v6 immutability)
- No stale cache issues (contract ABI and address do not change)
- Memory usage is predictable and bounded by the number of unique contracts

**Negative:**

- Each unique signer creates a new contract instance (memory cost per signer)
- Cache never evicts (memory is not reclaimed, but impact is negligible)
