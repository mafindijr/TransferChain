# Event System

## Table of Contents

- [Three Capabilities](#three-capabilities)
- [Typed Event Map](#typed-event-map)
- [Live Subscriptions](#live-subscriptions)
- [Historical Queries](#historical-queries)
- [Transaction Events](#transaction-events)
- [Event Decoding](#event-decoding)

---

## Three Capabilities

The event system provides three distinct capabilities:

| Capability | Use Case | Mechanism |
|-----------|----------|-----------|
| **Live Subscription** | Real-time notifications | WebSocket or polling |
| **Historical Queries** | Fetch past events with filters | `eth_getLogs` |
| **Transaction Events** | Decode events from a TX receipt | Receipt log parsing |

---

## Typed Event Map

All 32 contract events are defined in a typed event map:

```typescript
type ContractEventMap = {
  // PlayerRegistry (3 events)
  PlayerRegistered: { owner: string; playerId: bigint; metadataURI: string };
  PlayerMetadataUpdated: { owner: string; playerId: bigint; metadataURI: string };
  PlayerStatusUpdated: { owner: string; playerId: bigint; status: PlayerStatus };

  // ClubRegistry (3 events)
  ClubRegistered: { owner: string; clubId: bigint; name: string };
  ClubMetadataUpdated: { owner: string; clubId: bigint; metadataURI: string };
  ClubStatusUpdated: { owner: string; clubId: bigint; status: ClubStatus };

  // TransferMarketplace (4 events)
  ListingCreated: { listingId: bigint; seller: string; playerId: bigint; price: bigint };
  ListingCancelled: { listingId: bigint; seller: string };
  OfferMade: { listingId: bigint; buyer: string; amount: bigint };
  OfferRejected: { listingId: bigint; buyer: string };

  // TransferAgreementManager (4 events)
  AgreementCreated: { agreementId: bigint; listingId: bigint; buyer: string };
  AgreementApproved: { agreementId: bigint };
  AgreementRejected: { agreementId: bigint };
  AgreementSigned: { agreementId: bigint };

  // Escrow (4 events)
  DepositCreated: { depositId: bigint; token: string; amount: bigint; agreementId: bigint };
  DepositFunded: { depositId: bigint; token: string; amount: bigint };
  DepositReleased: { depositId: bigint; payee: string; amount: bigint };
  DepositRefunded: { depositId: bigint; payer: string; amount: bigint };

  // Config (5 events)
  TreasuryUpdated: { treasury: string };
  MarketplaceFeeUpdated: { feeBps: bigint };
  PaymentTokenUpdated: { token: string; supported: boolean };
  EmergencyModeUpdated: { enabled: boolean };
  ProtocolPaused: { paused: boolean };

  // AccessControl (5 events)
  Paused: { account: string };
  Unpaused: { account: string };
  RoleGranted: { role: string; account: string; sender: string };
  RoleRevoked: { role: string; account: string; sender: string };
  RoleAdminChanged: { role: string; previousAdminRole: string; newAdminRole: string };

  // Treasury (3 events)
  TokenDeposited: { token: string; amount: bigint };
  TokenWithdrawn: { token: string; to: string; amount: bigint };

  // Ownable (2 events)
  OwnershipTransferred: { previousOwner: string; newOwner: string };
};
```

---

## Live Subscriptions

Subscribe to events in real-time:

```typescript
const unsubscribe = tc.events.subscribe("ListingCreated", (event) => {
  console.log(`New listing #${event.listingId} by ${event.seller}`);
});

// Later: unsubscribe to stop listening
unsubscribe();
```

### Subscription Options

```typescript
interface SubscriptionOptions {
  /** Filter by contract address (defaults to all SDK contracts) */
  address?: string;

  /** Filter by block range */
  fromBlock?: bigint;
  toBlock?: bigint;

  /** Custom predicate for additional filtering */
  filter?: (event: ContractEventMap[K]) => boolean;
}
```

### Example with Filters

```typescript
const unsubscribe = tc.events.subscribe("ListingCreated", (event) => {
  console.log(`High-value listing: ${event.price}`);
}, {
  filter: (event) => event.price > 100n * 10n ** 18n,
});
```

### Transport

| Provider Type | Mechanism | Efficiency |
|--------------|-----------|------------|
| WebSocket | Push-based subscription | High |
| HTTP (JsonRpcProvider) | Polling `eth_getLogs` per block | Medium |

---

## Historical Queries

Query past events with block ranges and filters:

```typescript
const listings = await tc.events.query("ListingCreated", {
  fromBlock: 1000000n,
  toBlock: "latest",
  filters: { seller: "0xBEEF..." },
});
```

### Query Options

```typescript
interface QueryOptions {
  fromBlock: bigint | "earliest";
  toBlock: bigint | "latest";
  address?: string;
  filters?: Record<string, unknown>;
}
```

### Return Type

```typescript
// Returns an array of typed events
const events: ContractEventMap["ListingCreated"][] = await tc.events.query(...);
```

---

## Transaction Events

When a write method returns `TransactionResult<T>`, the `events` array contains decoded events specific to that transaction:

```typescript
const result = await tc.marketplace.createListing(params);

// result.events contains only events from this transaction
const [listingCreated] = result.events;
console.log(listingCreated.listingId);  // Typed as bigint
console.log(listingCreated.seller);     // Typed as string (checksummed)
console.log(listingCreated.price);      // Typed as bigint
```

This is the primary pattern for most use cases — consumers rarely need to query events separately.

---

## Event Decoding

The `EventDecoder` converts raw `ethers.Log` objects into typed events:

1. **Topic matching:** The log's first topic is compared against known event signatures
2. **ABI decoding:** Matching logs are decoded using the contract's interface
3. **Type mapping:** Decoded values are mapped to the `ContractEventMap` types
4. **Enum conversion:** Numeric enum values are converted to PascalCase enums

### Error Handling

Logs that cannot be decoded (from unknown contracts or future event versions) are silently skipped. This ensures the SDK is forward-compatible with contract upgrades that add new events.
