# ADR-0001: SDK-First Principle

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The TransferChain protocol serves multiple consumers: the official frontend, backend services, partner clubs, football organizations, and future mobile applications. Without a single enforced interface, each consumer would independently import contract ABIs, manage deployed addresses, decode events, and handle errors — duplicating logic and introducing inconsistencies.

## Decision

All blockchain interaction must flow through the TransferChain SDK. Applications must never instantiate `ethers.Contract` directly, import ABI files, manage deployed contract addresses, or manually decode events. The SDK is the sole owner of all blockchain communication.

## Consequences

**Positive:**

- Single source of truth for blockchain interaction patterns
- Consistent error handling across all consumers
- Contract address management centralized in deployment manifests
- Event decoding abstracted away from consumers
- Stable public API that can evolve without breaking consumers

**Negative:**

- Applications lose direct access to ethers.js for ad-hoc queries
- Any SDK bug or missing feature blocks all consumers until patched
- Slight abstraction overhead for developers who already know ethers.js
