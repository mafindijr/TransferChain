import { ethers } from "ethers";
import type { Logger } from "../logger/types.js";
import type { ContractRegistry } from "../core/contract-registry.js";
import {
  PLAYER_REGISTRY_ABI,
  CLUB_REGISTRY_ABI,
  MARKETPLACE_ABI,
  AGREEMENT_MANAGER_ABI,
  ESCROW_ABI,
  CONFIG_ABI,
  ACCESS_CONTROL_ABI,
  TREASURY_ABI,
} from "../abi/index.js";
import type {
  ContractEventName,
  SubscriptionOptions,
  QueryOptions,
  DecodedEvent,
} from "./types.js";

/** All contract ABIs combined for event topic decoding. */
const ALL_ABIS: ethers.InterfaceAbi = [
  ...PLAYER_REGISTRY_ABI,
  ...CLUB_REGISTRY_ABI,
  ...MARKETPLACE_ABI,
  ...AGREEMENT_MANAGER_ABI,
  ...ESCROW_ABI,
  ...CONFIG_ABI,
  ...ACCESS_CONTROL_ABI,
  ...TREASURY_ABI,
];

/**
 * Provides live subscriptions, historical queries, and transaction
 * event decoding for all TransferChain contract events.
 *
 * @example
 * ```ts
 * // Live subscription
 * const unsub = tc.events.subscribe("ListingCreated", (event) => {
 *   console.log(`New listing #${event.args.listingId}`);
 * });
 *
 * // Historical query
 * const events = await tc.events.query("ListingCreated", {
 *   fromBlock: 1000000n,
 *   toBlock: "latest",
 * });
 * ```
 */
export class EventManager {
  private readonly provider: ethers.Provider;
  private readonly logger: Logger;
  private readonly iface: ethers.Interface;
  private readonly subscriptions = new Map<string, () => void>();
  private destroyed = false;

  constructor(
    provider: ethers.Provider,
    _contractRegistry: ContractRegistry,
    logger: Logger,
  ) {
    this.provider = provider;
    this.logger = logger;
    this.iface = new ethers.Interface(ALL_ABIS);
  }

  /**
   * Subscribe to a contract event in real-time.
   *
   * Returns an unsubscribe function. Call it to stop listening.
   *
   * @param eventName - The event name from {@link ContractEventMap}.
   * @param callback - Called for each decoded event.
   * @param options - Optional filters.
   * @returns An unsubscribe function.
   */
  subscribe<K extends ContractEventName>(
    eventName: K,
    callback: (event: DecodedEvent<K>) => void,
    options?: SubscriptionOptions,
  ): () => void {
    this.assertNotDestroyed();

    const eventFragment = this.iface.getEvent(eventName);
    if (eventFragment === null) {
      throw new Error(`Unknown event: ${eventName}`);
    }

    const topicHash = eventFragment.topicHash;
    const subscriptionId = `${eventName}:${Date.now()}:${Math.random()}`;

    this.logger.debug("Subscribing to event", { eventName, subscriptionId });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      topics: [topicHash],
    };

    if (options?.address !== undefined) {
      filter.address = options.address;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (log: any) => {
      const decoded = this.decodeLog(log as ethers.Log);
      if (decoded === null || decoded.eventName !== eventName) {
        return;
      }

      const blockNum = decoded.blockNumber;
      if (options?.fromBlock !== undefined && blockNum < options.fromBlock) {
        return;
      }
      if (options?.toBlock !== undefined && blockNum > options.toBlock) {
        return;
      }

      if (options?.filter !== undefined && !options.filter(decoded.args)) {
        return;
      }

      callback(decoded as DecodedEvent<K>);
    };

    this.provider.on(filter, handler);

    const unsubscribe = () => {
      this.logger.debug("Unsubscribing from event", {
        eventName,
        subscriptionId,
      });
      this.provider.off(filter, handler);
      this.subscriptions.delete(subscriptionId);
    };

    this.subscriptions.set(subscriptionId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Query historical events with block range filtering.
   *
   * @param eventName - The event name from {@link ContractEventMap}.
   * @param options - The query options (fromBlock, toBlock, etc.).
   * @returns An array of decoded events matching the query.
   */
  async query<K extends ContractEventName>(
    eventName: K,
    options: QueryOptions,
  ): Promise<DecodedEvent<K>[]> {
    this.assertNotDestroyed();

    const eventFragment = this.iface.getEvent(eventName);
    if (eventFragment === null) {
      throw new Error(`Unknown event: ${eventName}`);
    }

    const topicHash = eventFragment.topicHash;
    const fromBlock =
      options.fromBlock === "earliest" ? 0 : Number(options.fromBlock);
    const toBlock =
      options.toBlock === "latest" ? "latest" : Number(options.toBlock);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      topics: [topicHash],
      fromBlock,
      toBlock,
    };

    if (options.address !== undefined) {
      filter.address = options.address;
    }

    this.logger.debug("Querying events", {
      eventName,
      fromBlock,
      toBlock,
    });

    const logs = await this.provider.getLogs(filter);

    return logs
      .map((log) => this.decodeLog(log))
      .filter(
        (e): e is DecodedEvent<K> =>
          e !== null && e.eventName === eventName,
      );
  }

  /**
   * Decode raw logs from a transaction receipt into typed events.
   *
   * @param logs - The raw transaction logs.
   * @returns All decoded TransferChain events found in the logs.
   */
  decodeTransactionLogs(logs: readonly ethers.Log[]): DecodedEvent[] {
    const results: DecodedEvent[] = [];

    for (const log of logs) {
      const decoded = this.decodeLog(log);
      if (decoded !== null) {
        results.push(decoded);
      }
    }

    return results;
  }

  /**
   * Remove all active subscriptions and release resources.
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    for (const unsub of this.subscriptions.values()) {
      unsub();
    }
    this.subscriptions.clear();
    this.logger.info("EventManager destroyed");
  }

  // ── Private Helpers ───────────────────────────────────────────

  private decodeLog(log: ethers.Log): DecodedEvent | null {
    try {
      const parsed = this.iface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (parsed === null) {
        return null;
      }

      return {
        eventName: parsed.name as ContractEventName,
        args: parsed.args as unknown as DecodedEvent["args"],
        blockNumber: BigInt(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: log.index,
      };
    } catch {
      return null;
    }
  }

  private assertNotDestroyed(): void {
    if (this.destroyed) {
      throw new Error("EventManager has been destroyed");
    }
  }
}
