# TransferChain Protocol Architecture

## 1. Purpose and Scope

This repository will contain the smart contract layer for TransferChain only. The protocol is intended to be production-grade, modular, and suitable for long-term evolution within the Injective ecosystem and beyond.

This architecture is intentionally designed to:

- separate business domains into independent contracts;
- keep on-chain storage minimal and efficient;
- keep off-chain metadata decentralized and extensible;
- provide a stable ABI for downstream SDK integration;
- support future cross-chain settlement readiness without changing the core storage model.

The frontend, SDK, backend, and off-chain services are explicitly out of scope for this repository.

---

## 2. Architectural Principles

1. Security first
   - Every state-changing function must minimize risk.
   - Funds handling must use strict validation, access control, and reentrancy protection.

2. Separation of concerns
   - Registries own identity data.
   - Marketplace owns listing and offer lifecycle.
   - Agreement manager owns negotiation terms.
   - Escrow owns settlement state.
   - Treasury owns protocol revenue.
   - Configuration owns protocol-wide parameters.

3. Gas efficiency
   - Store only minimal on-chain state.
   - Keep metadata off-chain through URI pointers.
   - Use compact enums and explicit storage ownership.

4. SDK-friendly ABI
   - Use clear function names and stable event semantics.
   - Avoid unnecessary state coupling between modules.
   - Keep interfaces simple and predictable.

5. Future extensibility
   - The design should support future clauses, additional settlement mechanisms, and cross-chain integration without major refactoring.

---

## 3. Architecture Overview

TransferChain will be composed of a small set of domain-specific contracts and shared infrastructure contracts.

### Core system layers

- Shared infrastructure
  - Access control
  - Pause and emergency controls
  - Protocol configuration
  - Common errors and event definitions

- Identity and registry layer
  - Player registry
  - Club registry

- Transaction layer
  - Transfer marketplace
  - Transfer agreement manager
  - Escrow
  - Treasury

This separation ensures that each contract has one clear responsibility and that protocol logic remains auditable.

---

## 4. Contract Responsibilities

### 4.1 TransferChainAccessControl

Responsible for protocol-wide access control.

Roles should include:

- DEFAULT_ADMIN_ROLE
- PAUSER_ROLE
- REGISTRY_ADMIN_ROLE
- MARKETPLACE_ADMIN_ROLE
- AGREEMENT_ADMIN_ROLE
- ESCROW_MANAGER_ROLE
- TREASURY_ADMIN_ROLE
- CONFIG_ADMIN_ROLE

Responsibilities:

- grant and revoke roles;
- define role-based access for privileged actions;
- enable emergency pause coordination;
- prevent unauthorized protocol administration.

### 4.2 TransferChainConfig

Responsible for protocol-wide configuration.

Responsibilities:

- store the protocol treasury address;
- store the marketplace fee basis points;
- manage supported payment tokens;
- expose protocol version information;
- hold emergency settings such as pause state and operational flags;
- avoid hardcoded values throughout the protocol.

This contract should be the single source of truth for operating parameters.

### 4.3 PlayerRegistry

Responsible for player identity registration and lifecycle.

On-chain state should remain minimal. The contract should store:

- player ID;
- owner or controller wallet;
- metadata URI;
- registration timestamp;
- status;
- optional current club reference;
- version or revision counter.

The player profile itself should be stored off-chain in a metadata document referenced by metadataURI.

The metadata model should support:

- name
- age
- nationality
- preferred foot
- position
- height
- current club
- photo
- highlight videos
- social links
- achievements

The metadata structure should be flexible and extensible. A versioned JSON schema stored on IPFS or similar decentralized storage is appropriate.

Recommended metadata pattern:

- metadataURI points to a JSON document;
- metadata schema is versioned;
- additional fields can be appended without changing core contract storage.

### 4.4 ClubRegistry

Responsible for club registration and lifecycle.

On-chain state should remain compact and include:

- club ID;
- owner or admin address;
- club name reference or metadata URI;
- country;
- city;
- league;
- logo URI;
- website;
- verification status;
- registration timestamp;
- status.

The club metadata should be stored off-chain and referenced by metadataURI.

This keeps the contract gas-efficient while allowing rich club profiles over time.

### 4.5 TransferMarketplace

Responsible only for the marketplace lifecycle.

This contract should manage:

- listing creation;
- listing updates;
- listing cancellation;
- offers or bid intents;
- negotiation lifecycle state;
- settlement entry points.

It should not own business logic that belongs in other modules.

Responsibilities that should remain outside this contract include:

- transfer agreement clause validation;
- escrow fund custody;
- treasury accounting;
- transfer eligibility policy.

### 4.6 TransferAgreementManager

Responsible for storing and managing transfer agreements.

The agreement model should support future expansion without major restructuring. Each agreement should be able to represent a broad set of commercial terms, including:

- transfer fee
- signing bonus
- sell-on percentage
- release clause
- installment schedule
- appearance bonus
- goal bonus
- medical approval requirement
- negotiation deadline
- agreement expiration
- signatures
- agreement status

To support future growth, the agreement should be modeled around:

- a stable agreement ID;
- a referenced listing or negotiation context;
- a structured clause container;
- explicit status transitions;
- versioned clause definitions.

This allows new clauses to be introduced in future versions without needing a complete redesign of the storage model.

### 4.7 Escrow

Responsible for custody of funds during a transaction lifecycle.

This contract should support:

- deposits in multiple ERC-20 payment tokens;
- release of funds on completion;
- refund on cancellation or failed execution;
- dispute handling by authorized roles;
- future expansion to additional settlement flows.

It should not be hardcoded to a single payment token.

The storage layout should be designed so future settlement methods can be added without rewriting the core structure.

### 4.8 Treasury

Responsible for protocol revenue management.

Responsibilities:

- receive protocol fees;
- account for fee flows;
- permit controlled withdrawals by authorized roles;
- support future revenue management and reporting.

Marketplace contracts must never directly control protocol revenue. Revenue should flow to Treasury through the protocol configuration and settlement path.

---

## 5. Metadata Strategy

### 5.1 Player metadata

Player data should be stored off-chain and referenced by a metadataURI.

Suggested metadata fields:

- name
- age
- nationality
- preferredFoot
- position
- height
- currentClub
- photoURI
- highlightVideoURIs
- socialLinks
- achievements

Recommended design:

- each player profile uses a versioned JSON document;
- the contract stores only a URI and a pointer to the current revision;
- the metadata object can evolve independently of the contract.

### 5.2 Club metadata

Club metadata should also be decentralized and extensible.

Suggested fields:

- clubName
- country
- city
- league
- logoURI
- website
- verificationStatus
- description
- socialLinks

This keeps the registry affordable while preserving rich club profile information.

### 5.3 Agreement clause strategy

Agreement terms should be structured so new clauses can be added later.

A future-proof approach is:

- keep core agreement fields on-chain;
- represent clauses as a versioned structure;
- reserve space for future clause types without breaking the ABI.

---

## 6. Dependency Diagram

```text
TransferChainAccessControl
        |
        +--> TransferChainConfig
        |
        +--> PlayerRegistry
        |
        +--> ClubRegistry
        |
        +--> TransferMarketplace
        |
        +--> TransferAgreementManager
        |
        +--> Escrow
        |
        +--> Treasury
```

The module dependencies should remain directional and explicit. Contracts should interact through interfaces rather than through hidden storage coupling.

---

## 7. Contract Interaction Flow

### 7.1 Player and club onboarding

1. A club or authorized actor registers a club.
2. A player identity is registered with a metadataURI.
3. The player is linked to a club reference if applicable.

### 7.2 Marketplace flow

1. A seller creates a listing in TransferMarketplace.
2. A buyer or interested party submits an offer or enters negotiation.
3. The marketplace updates the listing lifecycle.
4. If the parties proceed, the marketplace routes settlement to the agreement and escrow flow.

### 7.3 Agreement and escrow flow

1. TransferAgreementManager creates a transfer agreement with commercial terms.
2. The agreement references the listing and the relevant parties.
3. Escrow accepts funds in an approved ERC-20 token.
4. Agreement completion triggers release or refund based on outcome.
5. Treasury receives protocol fees through the configured fee path.

---

## 8. Storage Ownership

Storage ownership should be clearly assigned:

- PlayerRegistry owns all player registry state.
- ClubRegistry owns all club registry state.
- TransferMarketplace owns listing and offer lifecycle state.
- TransferAgreementManager owns agreement state.
- Escrow owns deposit and settlement state.
- Treasury owns protocol fee balances and accounting state.
- TransferChainConfig owns protocol-wide configuration state.

This makes ownership clear, simplifies auditing, and reduces the chance of accidental state coupling between modules.

---

## 9. Deployment Order

The deployment order should be:

1. Deploy TransferChainAccessControl.
2. Deploy TransferChainConfig.
3. Deploy Treasury.
4. Deploy PlayerRegistry.
5. Deploy ClubRegistry.
6. Deploy TransferMarketplace.
7. Deploy TransferAgreementManager.
8. Deploy Escrow.
9. Configure roles and module references.
10. Initialize protocol configuration values.

The deployment sequence should ensure that each module has access to the shared configuration and access control system before it begins handling user actions.

---

## 10. Upgrade Considerations

The MVP may use non-upgradeable implementations for simplicity and auditability. However, the architecture should remain compatible with future upgradeability patterns if needed.

When upgradeability is introduced later, the protocol should:

- use a controlled upgrade path;
- preserve storage layout carefully;
- keep module boundaries intact;
- avoid breaking ABI compatibility where possible;
- use role-based governance for upgrades.

The initial design should favor clarity and auditability over premature upgrade complexity.

---

## 11. Security Considerations

The protocol must be designed with strong safeguards from the beginning.

### Required protections

- access control for all privileged operations;
- reentrancy protection on all fund-handling flows;
- explicit pause support for emergency operational shutdown;
- strict validation for every external input;
- custom errors instead of generic revert strings;
- clear separation of admin actions and end-user actions;
- strict token approval and balance checks for ERC-20 escrow flows.

### Additional safeguards

- role separation between configuration, treasury, and execution modules;
- explicit state transitions for listings, agreements, and escrow deposits;
- no direct protocol revenue ownership by marketplace contracts;
- reserve capability for future dispute and arbitration layers.

---

## 12. SDK Integration Strategy

The ABI should be designed for SDK consumption from day one.

The protocol should aim for:

- predictable event naming;
- stable function signatures where possible;
- readable public interfaces;
- minimal state coupling across contracts;
- straightforward indexing patterns for off-chain clients.

Recommended practices:

- emit explicit events for every major state transition;
- avoid overloaded functions where they create ABI ambiguity;
- use descriptive names for state-changing functions;
- keep interfaces versioned and documented.

The SDK can consume the resulting ABI without needing special backend translation layers.

---

## 13. Cross-Chain Readiness

Although the MVP targets the Injective ecosystem, the architecture should not encode chain-specific assumptions into the core model.

The design should support future expansion by:

- keeping core identity and agreement state chain-agnostic;
- using stable identifiers and protocol-level context objects;
- avoiding storage patterns that would be difficult to adapt to multi-chain messaging or settlement systems;
- keeping settlement logic modular so cross-chain execution can be layered in later.

No cross-chain logic is required for the MVP, but the architecture should not block it.

---

## 14. Foundry Project Structure

A scalable Foundry layout for this protocol should look like this:

```text
src/
  core/
    TransferChainAccessControl.sol
    TransferChainConfig.sol
    TransferChainErrors.sol
    TransferChainEvents.sol
    TransferChainPausable.sol
  registries/
    PlayerRegistry.sol
    ClubRegistry.sol
  marketplace/
    TransferMarketplace.sol
  agreements/
    TransferAgreementManager.sol
  escrow/
    Escrow.sol
  treasury/
    Treasury.sol
  interfaces/
    IPlayerRegistry.sol
    IClubRegistry.sol
    ITransferMarketplace.sol
    ITransferAgreementManager.sol
    IEscrow.sol
    ITreasury.sol
    ITransferChainConfig.sol
  libraries/
    TransferChainLib.sol
    AgreementLib.sol
    MetadataLib.sol
  utils/
    Constants.sol
    Types.sol

script/
  Deploy.s.sol
  Configure.s.sol

test/
  unit/
  integration/

README.md
foundry.toml
```

This structure keeps modules organized as the protocol grows and makes it easier to add new features without turning the codebase into a monolith.

---

## 15. Proposed Implementation Sprint Plan

The implementation should proceed incrementally and in order:

- Sprint 1: Scaffold Foundry project, folder structure, dependencies, and README
- Sprint 2: Access control
- Sprint 3: Config
- Sprint 4: Player registry
- Sprint 5: Club registry
- Sprint 6: Transfer marketplace
- Sprint 7: Transfer agreement manager
- Sprint 8: Escrow
- Sprint 9: Treasury
- Sprint 10: Integration
- Sprint 11: Comprehensive Foundry tests
- Sprint 12: Deployment scripts and documentation

No contract implementation should begin until this architecture is approved.

---

## 16. Final Architectural Recommendation

The recommended direction is a modular protocol with:

- minimal on-chain identity and metadata pointers;
- rich off-chain metadata for players and clubs;
- a dedicated marketplace focused on listing and negotiation lifecycle;
- a flexible agreement model for future commercial clauses;
- multi-token escrow and dedicated treasury management;
- centralized protocol configuration for long-term maintainability.

This architecture is suitable for a production-grade protocol and provides a strong foundation for incremental implementation.
