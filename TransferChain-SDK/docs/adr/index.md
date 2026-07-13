# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for the TransferChain SDK. Each ADR documents a significant architectural decision, its context, and its consequences.

## Format

Each ADR follows a lightweight format:

- **Status:** Proposed | Accepted | Deprecated | Superseded
- **Context:** The situation and constraints that motivated the decision (2-3 sentences)
- **Decision:** What was decided (1 paragraph)
- **Consequences:** Positive and negative outcomes (bullet list)

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](./0001-sdk-first.md) | SDK-First Principle | Accepted | 2026-07-13 |
| [0002](./0002-ethers-v6.md) | ethers.js v6 as Ethereum Library | Accepted | 2026-07-13 |
| [0003](./0003-provider-manager.md) | Provider Manager Pattern | Accepted | 2026-07-13 |
| [0004](./0004-manual-dependency-injection.md) | Manual Dependency Injection | Accepted | 2026-07-13 |
| [0005](./0005-no-query-result-caching.md) | No Query Result Caching | Accepted | 2026-07-13 |
| [0006](./0006-bigint-everywhere.md) | BigInt for All On-Chain Values | Accepted | 2026-07-13 |
| [0007](./0007-silent-default-logger.md) | Silent Default Logger | Accepted | 2026-07-13 |
| [0008](./0008-middleware-onion-model.md) | Middleware Onion Model | Accepted | 2026-07-13 |
| [0009](./0009-contract-registry-caching.md) | Contract Registry Caching | Accepted | 2026-07-13 |
| [0010](./0010-facade-pattern.md) | Facade Pattern | Accepted | 2026-07-13 |

## Creating New ADRs

When a new architectural decision needs to be recorded:

1. Copy `0000-template.md` to `NNNN-short-title.md`
2. Fill in the title, status, context, decision, and consequences
3. Add an entry to the index table above
4. Reference the ADR from relevant documentation files
