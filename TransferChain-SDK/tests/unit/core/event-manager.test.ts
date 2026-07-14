import { describe, it, expect, vi, beforeEach } from "vitest";
import { ethers } from "ethers";
import { EventManager } from "../../../src/events/event-manager.js";
import type { Logger } from "../../../src/logger/types.js";
import type { ContractRegistry } from "../../../src/core/contract-registry.js";

function createMockLogger(): Logger {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockProvider() {
  return {
    on: vi.fn(),
    off: vi.fn(),
    getLogs: vi.fn().mockResolvedValue([]),
  } as unknown as ethers.Provider;
}

function createMockRegistry(): ContractRegistry {
  return {
    getReadContract: vi.fn(),
    getWriteContract: vi.fn(),
    getAddress: vi.fn(),
  } as unknown as ContractRegistry;
}

function createMockLog(
  overrides: Partial<ethers.Log> = {},
): ethers.Log {
  return {
    address: "0x0000000000000000000000000000000000000001",
    topics: [],
    data: "0x",
    blockNumber: 100,
    blockHash: "0xblockhash",
    transactionHash: "0xtxhash",
    transactionIndex: 0,
    index: 0,
    removed: false,
    ...overrides,
  };
}

describe("EventManager", () => {
  let eventManager: EventManager;
  let mockProvider: ReturnType<typeof createMockProvider>;
  let mockLogger: Logger;
  let mockRegistry: ContractRegistry;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockProvider = createMockProvider();
    mockLogger = createMockLogger();
    mockRegistry = createMockRegistry();
    eventManager = new EventManager(mockProvider, mockRegistry, mockLogger);
  });

  describe("subscribe", () => {
    it("should register a listener with the provider", () => {
      eventManager.subscribe("ListingCreated", vi.fn());
      expect(mockProvider.on).toHaveBeenCalledOnce();
    });

    it("should return an unsubscribe function", () => {
      const unsub = eventManager.subscribe("ListingCreated", vi.fn());
      expect(typeof unsub).toBe("function");
    });

    it("should call provider.off when unsubscribing", () => {
      const unsub = eventManager.subscribe("ListingCreated", vi.fn());
      unsub();
      expect(mockProvider.off).toHaveBeenCalledOnce();
    });

    it("should throw for unknown event names", () => {
      expect(() =>
        eventManager.subscribe(
          "NonExistentEvent" as never,
          vi.fn(),
        ),
      ).toThrow("Unknown event");
    });

    it("should filter by address when provided", () => {
      eventManager.subscribe("ListingCreated", vi.fn(), {
        address: "0xBEEF",
      });
      const callArgs = vi.mocked(mockProvider.on).mock.calls[0];
      const filter = callArgs[0] as { address?: string };
      expect(filter.address).toBe("0xBEEF");
    });
  });

  describe("query", () => {
    it("should call provider.getLogs with correct topic", async () => {
      await eventManager.query("ListingCreated", {
        fromBlock: 100n,
        toBlock: 200n,
      });
      expect(mockProvider.getLogs).toHaveBeenCalledOnce();
      const callArgs = vi.mocked(mockProvider.getLogs).mock.calls[0][0] as {
        topics: string[];
        fromBlock: number;
        toBlock: number;
      };
      expect(callArgs.topics).toHaveLength(1);
      expect(typeof callArgs.topics[0]).toBe("string");
      expect(callArgs.fromBlock).toBe(100);
      expect(callArgs.toBlock).toBe(200);
    });

    it("should handle 'earliest' and 'latest' block values", async () => {
      await eventManager.query("ListingCreated", {
        fromBlock: "earliest",
        toBlock: "latest",
      });
      const callArgs = vi.mocked(mockProvider.getLogs).mock.calls[0][0] as {
        fromBlock: number;
        toBlock: string;
      };
      expect(callArgs.fromBlock).toBe(0);
      expect(callArgs.toBlock).toBe("latest");
    });

    it("should return empty array when no logs match", async () => {
      const result = await eventManager.query("ListingCreated", {
        fromBlock: 0n,
        toBlock: "latest",
      });
      expect(result).toEqual([]);
    });

    it("should throw for unknown event names", async () => {
      await expect(
        eventManager.query("NonExistentEvent" as never, {
          fromBlock: 0n,
          toBlock: "latest",
        }),
      ).rejects.toThrow("Unknown event");
    });

    it("should filter by address when provided", async () => {
      await eventManager.query("ListingCreated", {
        fromBlock: 0n,
        toBlock: "latest",
        address: "0xBEEF",
      });
      const callArgs = vi.mocked(mockProvider.getLogs).mock.calls[0][0] as {
        address?: string;
      };
      expect(callArgs.address).toBe("0xBEEF");
    });
  });

  describe("decodeTransactionLogs", () => {
    it("should return empty array for no logs", () => {
      const result = eventManager.decodeTransactionLogs([]);
      expect(result).toEqual([]);
    });

    it("should silently skip unparseable logs", () => {
      const log = createMockLog({
        topics: ["0xnonexistent"],
      });
      const result = eventManager.decodeTransactionLogs([log]);
      expect(result).toEqual([]);
    });
  });

  describe("destroy", () => {
    it("should call unsubscribe for all active subscriptions", () => {
      eventManager.subscribe("ListingCreated", vi.fn());
      eventManager.subscribe("AgreementCreated", vi.fn());
      eventManager.destroy();
      expect(mockProvider.off).toHaveBeenCalledTimes(2);
    });

    it("should be idempotent", () => {
      eventManager.subscribe("ListingCreated", vi.fn());
      eventManager.destroy();
      expect(() => eventManager.destroy()).not.toThrow();
    });

    it("should prevent new subscriptions after destroy", () => {
      eventManager.destroy();
      expect(() =>
        eventManager.subscribe("ListingCreated", vi.fn()),
      ).toThrow("destroyed");
    });

    it("should prevent new queries after destroy", async () => {
      eventManager.destroy();
      await expect(
        eventManager.query("ListingCreated", {
          fromBlock: 0n,
          toBlock: "latest",
        }),
      ).rejects.toThrow("destroyed");
    });
  });
});
