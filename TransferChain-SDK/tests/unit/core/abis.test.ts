import { describe, it, expect } from "vitest";
import {
  ACCESS_CONTROL_ABI,
  CONFIG_ABI,
  PLAYER_REGISTRY_ABI,
  CLUB_REGISTRY_ABI,
  MARKETPLACE_ABI,
  AGREEMENT_MANAGER_ABI,
  ESCROW_ABI,
  TREASURY_ABI,
} from "../../../src/abi/index.js";
import { CONTRACT_NAMES } from "../../../src/constants/contracts.js";

describe("Contract ABIs", () => {
  const abiEntries = [
    ["ACCESS_CONTROL_ABI", ACCESS_CONTROL_ABI],
    ["CONFIG_ABI", CONFIG_ABI],
    ["PLAYER_REGISTRY_ABI", PLAYER_REGISTRY_ABI],
    ["CLUB_REGISTRY_ABI", CLUB_REGISTRY_ABI],
    ["MARKETPLACE_ABI", MARKETPLACE_ABI],
    ["AGREEMENT_MANAGER_ABI", AGREEMENT_MANAGER_ABI],
    ["ESCROW_ABI", ESCROW_ABI],
    ["TREASURY_ABI", TREASURY_ABI],
  ] as const;

  for (const [name, abi] of abiEntries) {
    it(`${name} should be a non-empty array`, () => {
      expect(Array.isArray(abi)).toBe(true);
      expect(abi.length).toBeGreaterThan(0);
    });

    it(`${name} entries should have a "type" field`, () => {
      for (const entry of abi) {
        expect(entry).toHaveProperty("type");
      }
    });
  }

  it("should export all 8 contract ABIs", () => {
    expect(abiEntries).toHaveLength(8);
  });
});

describe("CONTRACT_NAMES", () => {
  it("should have 8 contract name mappings", () => {
    expect(Object.keys(CONTRACT_NAMES)).toHaveLength(8);
  });

  it("should map SDK names to Solidity names", () => {
    expect(CONTRACT_NAMES.ACCESS_CONTROL).toBe("TransferChainAccessControl");
    expect(CONTRACT_NAMES.CONFIG).toBe("TransferChainConfig");
    expect(CONTRACT_NAMES.PLAYER_REGISTRY).toBe("PlayerRegistry");
    expect(CONTRACT_NAMES.CLUB_REGISTRY).toBe("ClubRegistry");
    expect(CONTRACT_NAMES.MARKETPLACE).toBe("TransferMarketplace");
    expect(CONTRACT_NAMES.AGREEMENT_MANAGER).toBe("TransferAgreementManager");
    expect(CONTRACT_NAMES.ESCROW).toBe("Escrow");
    expect(CONTRACT_NAMES.TREASURY).toBe("Treasury");
  });

  it("should have correct function entries for AccessControl", () => {
    const fnNames = ACCESS_CONTROL_ABI
      .filter((e: Record<string, unknown>) => e.type === "function")
      .map((e: Record<string, unknown>) => e.name);
    expect(fnNames).toContain("grantRole");
    expect(fnNames).toContain("revokeRole");
    expect(fnNames).toContain("hasRole");
    expect(fnNames).toContain("pause");
    expect(fnNames).toContain("unpause");
    expect(fnNames).toContain("isPaused");
  });

  it("should have correct function entries for PlayerRegistry", () => {
    const fnNames = PLAYER_REGISTRY_ABI
      .filter((e: Record<string, unknown>) => e.type === "function")
      .map((e: Record<string, unknown>) => e.name);
    expect(fnNames).toContain("registerPlayer");
    expect(fnNames).toContain("getPlayer");
    expect(fnNames).toContain("getPlayerOwner");
    expect(fnNames).toContain("nextPlayerId");
    expect(fnNames).toContain("updatePlayerMetadata");
    expect(fnNames).toContain("setPlayerStatus");
  });

  it("should have correct function entries for Treasury", () => {
    const fnNames = TREASURY_ABI
      .filter((e: Record<string, unknown>) => e.type === "function")
      .map((e: Record<string, unknown>) => e.name);
    expect(fnNames).toContain("depositToken");
    expect(fnNames).toContain("withdrawToken");
    expect(fnNames).toContain("tokenBalance");
    expect(fnNames).toContain("owner");
  });
});
