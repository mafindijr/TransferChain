# ADR-0002: ethers.js v6 as Ethereum Library

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The SDK needs a TypeScript Ethereum library for provider management, contract interaction, signing, and event decoding. The main contenders are ethers.js v6, viem, and web3.js. The library must support TypeScript, work in Node.js and browsers, and have a mature ecosystem.

## Decision

Use ethers.js v6 as the sole Ethereum library. The SDK wraps ethers.js internals entirely — consumers never import or interact with ethers.js directly. viem and web3.js are not used.

## Consequences

**Positive:**

- Widest adoption and community support in the TypeScript ecosystem
- Excellent TypeScript type inference for ABIs and contract calls
- Battle-tested provider, signer, and contract abstractions
- Team familiarity reduces implementation risk

**Negative:**

- Larger bundle size compared to viem (~120KB vs ~40KB gzipped)
- ethers.js v6 breaking changes from v5 require v6-specific patterns
- Consumers who prefer viem must still depend on ethers.js transitively
