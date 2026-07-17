# Public API

## Table of Contents

- [Facade Pattern](#facade-pattern)
- [API Surface Definition](#api-surface-definition)
- [Naming Conventions](#naming-conventions)
- [Read Methods](#read-methods)
- [Write Methods](#write-methods)
- [TransactionResult](#transactionresult)
- [Parameter Types](#parameter-types)
- [Return Type Mapping](#return-type-mapping)
- [BigInt Policy](#bigint-policy)
- [Tree Shaking](#tree-shaking)

---

## Facade Pattern

The `TransferChain` class is the single entry point for all SDK functionality. All domain clients are accessible as properties:

```typescript
const tc = new TransferChain({ chainId: 1439, rpcUrl: "..." });

// Domain clients as properties
tc.players      // PlayerRegistryClient
tc.clubs        // ClubRegistryClient
tc.marketplace  // MarketplaceClient
tc.agreements   // AgreementClient
tc.escrow       // EscrowClient
tc.treasury     // TreasuryClient
tc.config       // ConfigClient
tc.accessControl // AccessControlClient

// Extension systems as properties
tc.events       // EventManager
tc.metadata     // MetadataResolver
```

See [ADR-0010](./adr/0010-facade-pattern.md) for the rationale.

---

## API Surface Definition

### Public API

The public API consists of:

- All exports from `src/index.ts`
- All public methods on exported classes
- All exported types, interfaces, and enums
- All exported constants

### Internal API

Internal modules are not re-exported through the barrel and may change without notice:

- `src/core/ProviderManager.ts`
- `src/core/SignerManager.ts`
- `src/core/ContractRegistry.ts`
- `src/core/TransactionManager.ts`
- Internal helper functions
- Test utilities

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `TransferChain`, `PlayerRegistryClient` |
| Methods | camelCase | `getPlayer()`, `createListing()` |
| Enums | PascalCase values | `PlayerStatus.Active` |
| Types | PascalCase | `Player`, `Listing`, `SdkConfig` |
| Constants | SCREAMING_SNAKE | `REGISTRY_ADMIN_ROLE` |

---

## Read Methods

Read methods retrieve on-chain state. They accept simple arguments and return typed objects.

### Pattern

```typescript
// By address
getPlayer(owner: string): Promise<Player>

// By ID
getListing(listingId: bigint): Promise<Listing>

// Boolean checks
hasRole(role: string, account: string): Promise<boolean>

// Counters
getNextPlayerId(): Promise<bigint>
```

### Examples

```typescript
// Player
const player = await tc.players.getPlayer("0xBEEF...");
console.log(player.name, player.status, player.registeredAt);

// Club
const club = await tc.clubs.getClub("0xCAFE...");
console.log(club.name, club.league, club.country);

// Listing
const listing = await tc.marketplace.getListing(1n);
console.log(listing.price, listing.status);

// Agreement
const agreement = await tc.agreements.getAgreement(1n);
console.log(agreement.clauses.transferFee, agreement.status);

// Config
const fee = await tc.config.getMarketplaceFee();
console.log(`Fee: ${fee} basis points`);
```

---

## Write Methods

Write methods submit transactions. Simple operations use positional arguments. Complex operations use structured parameter objects.

### Simple (1-3 params)

```typescript
// Single argument
approveAgreement(agreementId: bigint): Promise<TransactionResult<AgreementApprovedEvent>>
refund(depositId: bigint): Promise<TransactionResult<DepositRefundedEvent>>
release(depositId: bigint): Promise<TransactionResult<DepositReleasedEvent>>
```

### Complex (4+ params)

```typescript
// Structured params
createListing(params: CreateListingParams): Promise<TransactionResult<ListingCreatedEvent>>
createAgreement(params: CreateAgreementParams): Promise<TransactionResult<AgreementCreatedEvent>>
registerClub(params: RegisterClubParams): Promise<TransactionResult<ClubRegisteredEvent>>
```

### Examples

```typescript
// Create a listing
const result = await tc.marketplace.createListing({
  seller: "0xBEEF...",
  playerId: 1n,
  clubId: 1n,
  price: 1000n * 10n ** 18n,
  metadataUri: "ipfs://Qm...",
});

console.log(`Listing #${result.events[0].listingId} created`);

// Approve an agreement
const approveResult = await tc.agreements.approveAgreement(1n);

// Deposit to escrow
const depositResult = await tc.escrow.deposit({
  token: "0x...",
  amount: 1000n * 10n ** 18n,
  agreementId: 1n,
  payee: "0xCAFE...",
});
```

---

## TransactionResult

Every write method returns a `TransactionResult<T>`:

```typescript
interface TransactionResult<TEvent = unknown> {
  /** The transaction hash */
  txHash: string;

  /** The confirmed transaction receipt */
  receipt: TransactionReceipt;

  /** Decoded events from this transaction */
  events: TEvent[];
}
```

### Usage

```typescript
const result = await tc.marketplace.createListing(params);

// Transaction hash
console.log(result.txHash);

// Receipt
console.log(result.receipt.status);      // 1 = success
console.log(result.receipt.blockNumber);

// Decoded events
const [event] = result.events;
console.log(event.listingId, event.seller, event.price);
```

---

## Parameter Types

Complex write operations define explicit parameter interfaces:

```typescript
interface CreateListingParams {
  seller: string;
  playerId: bigint;
  clubId: bigint;
  price: bigint;
  metadataUri: string;
}

interface CreateAgreementParams {
  listingId: bigint;
  buyer: string;
  seller: string;
  clauses: AgreementClauses;
  metadataUri: string;
}

interface AgreementClauses {
  transferFee: bigint;
  signingBonus: bigint;
  sellOnPercentage: bigint;
  releaseClause: bigint;
  installmentAmount: bigint;
  appearanceBonus: bigint;
  goalBonus: bigint;
  medicalApprovalRequired: boolean;
}

interface RegisterPlayerParams {
  owner: string;
  name: string;
  metadataUri: string;
}

interface RegisterClubParams {
  owner: string;
  name: string;
  metadataUri: string;
  country: string;
  city: string;
  league: string;
  logoUri: string;
  website: string;
}

interface DepositParams {
  token: string;
  amount: bigint;
  agreementId: bigint;
  payee: string;
}
```

---

## Return Type Mapping

| Solidity Type | TypeScript Type | Example |
|--------------|----------------|---------|
| `uint256` | `bigint` | `1000000000000000000n` |
| `address` | `string` | `"0xBEEF..."` (checksummed) |
| `bool` | `boolean` | `true` |
| `string` | `string` | `"Alice"` |
| `enum` | PascalCase enum | `PlayerStatus.Active` |
| `struct` | Plain object | `{ id: 1n, owner: "0x...", ... }` |
| `mapping` | Not returned | Queried via individual keys |

---

## BigInt Policy

All on-chain numeric values use native `bigint`. This includes:

- Token amounts and prices
- Entity IDs (player, club, listing, agreement, deposit)
- Timestamps
- Basis points
- Gas values

See [ADR-0006](./adr/0006-bigint-everywhere.md) for the rationale.

### Formatting Utilities

```typescript
import { formatBps, formatTokenAmount } from "@transferchain/sdk/utils";

// Basis points to percentage
formatBps(250n); // "2.5%"

// Token amount to human-readable
formatTokenAmount(1000n * 10n ** 18n, 18); // "1,000.0"
```

---

## Tree Shaking

The SDK is tree-shakeable:

- `package.json` declares `"sideEffects": false`
- Each domain client is a separate module
- Barrel exports use `export type` for type-only exports

### Import Patterns

```typescript
// Full SDK (pulls in everything)
import { TransferChain } from "@transferchain/sdk";

// Specific types (no runtime cost)
import type { Player, Listing } from "@transferchain/sdk";

// Utilities only (no contract clients)
import { formatBps } from "@transferchain/sdk/utils";
```

### Bundle Size Targets

| Import | Target Size (gzipped) |
|--------|----------------------|
| Full SDK | < 50KB |
| Single client | < 8KB |
| Types only | 0KB |
