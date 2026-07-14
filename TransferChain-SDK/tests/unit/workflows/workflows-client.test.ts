import { describe, it, expect, vi } from "vitest";
import { WorkflowsClient } from "../../../src/workflows/workflows-client.js";

function createMockClient<T extends Record<string, (...args: never[]) => unknown>>(
  overrides: T,
) {
  return new Proxy({} as T, {
    get(_target, prop) {
      const key = String(prop);
      if (key in overrides) {
        return overrides[key as keyof T];
      }
      return vi.fn();
    },
  });
}

function mockTxResult(events: Record<string, unknown>[] = []) {
  return {
    txHash: "0xabc",
    receipt: { status: 1, blockNumber: 100 },
    events,
  };
}

describe("WorkflowsClient", () => {
  describe("transfer", () => {
    it("executes agreement → approve → deposit → release", async () => {
      const agreementClient = createMockClient({
        createAgreement: vi.fn().mockResolvedValue(
          mockTxResult([{ agreementId: 1n }]),
        ),
        approveAgreement: vi.fn().mockResolvedValue(mockTxResult()),
      });
      const escrowClient = createMockClient({
        deposit: vi.fn().mockResolvedValue(
          mockTxResult([{ depositId: 10n }]),
        ),
        release: vi.fn().mockResolvedValue(mockTxResult()),
      });

      const workflows = new WorkflowsClient(
        agreementClient as never,
        escrowClient as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
      );

      const result = await workflows.transfer({
        agreement: {
          listingId: 5n,
          buyer: "0xBBBB",
          seller: "0xSSSS",
          transferFee: 1000n,
          signingBonus: 500n,
          sellOnPercentage: 100n,
          releaseClause: 2000n,
          installmentAmount: 100n,
          appearanceBonus: 50n,
          goalBonus: 25n,
        },
        deposit: {
          token: "0xTTTT",
          amount: 5000n,
          payee: "0xSSSS",
        },
        approver: "0xSSSS",
      });

      expect(result.agreement).toBeDefined();
      expect(result.deposit).toBeDefined();
      expect(result.release).toBeDefined();
      expect(agreementClient.createAgreement).toHaveBeenCalledOnce();
      expect(agreementClient.approveAgreement).toHaveBeenCalledWith(1n, "0xSSSS");
      expect(escrowClient.deposit).toHaveBeenCalledWith({
        token: "0xTTTT",
        amount: 5000n,
        agreementId: 1n,
        payee: "0xSSSS",
      });
      expect(escrowClient.release).toHaveBeenCalledWith(10n, "0xSSSS");
    });

    it("throws if agreement creation does not emit event", async () => {
      const agreementClient = createMockClient({
        createAgreement: vi.fn().mockResolvedValue(mockTxResult([])),
      });

      const workflows = new WorkflowsClient(
        agreementClient as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
      );

      await expect(
        workflows.transfer({
          agreement: {
            listingId: 5n,
            buyer: "0xBBBB",
            seller: "0xSSSS",
            transferFee: 1000n,
            signingBonus: 500n,
            sellOnPercentage: 100n,
            releaseClause: 2000n,
            installmentAmount: 100n,
            appearanceBonus: 50n,
            goalBonus: 25n,
          },
          deposit: {
            token: "0xTTTT",
            amount: 5000n,
            payee: "0xSSSS",
          },
          approver: "0xSSSS",
        }),
      ).rejects.toThrow("AgreementCreated event");
    });

    it("throws if deposit does not emit event", async () => {
      const agreementClient = createMockClient({
        createAgreement: vi.fn().mockResolvedValue(
          mockTxResult([{ agreementId: 1n }]),
        ),
        approveAgreement: vi.fn().mockResolvedValue(mockTxResult()),
      });
      const escrowClient = createMockClient({
        deposit: vi.fn().mockResolvedValue(mockTxResult([])),
      });

      const workflows = new WorkflowsClient(
        agreementClient as never,
        escrowClient as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
      );

      await expect(
        workflows.transfer({
          agreement: {
            listingId: 5n,
            buyer: "0xBBBB",
            seller: "0xSSSS",
            transferFee: 1000n,
            signingBonus: 500n,
            sellOnPercentage: 100n,
            releaseClause: 2000n,
            installmentAmount: 100n,
            appearanceBonus: 50n,
            goalBonus: 25n,
          },
          deposit: {
            token: "0xTTTT",
            amount: 5000n,
            payee: "0xSSSS",
          },
          approver: "0xSSSS",
        }),
      ).rejects.toThrow("DepositCreated event");
    });
  });

  describe("createListing", () => {
    it("delegates to marketplace client", async () => {
      const marketplaceClient = createMockClient({
        createListing: vi.fn().mockResolvedValue(
          mockTxResult([{ listingId: 1n }]),
        ),
      });

      const workflows = new WorkflowsClient(
        createMockClient({}) as never,
        createMockClient({}) as never,
        marketplaceClient as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
      );

      const result = await workflows.createListing({
        listing: {
          seller: "0xSSSS",
          playerId: 1n,
          clubId: 2n,
          price: 1000n,
          metadataUri: "ipfs://test",
        },
      });

      expect(result).toBeDefined();
      expect(marketplaceClient.createListing).toHaveBeenCalledOnce();
    });
  });

  describe("registerPlayer", () => {
    it("delegates to player registry client", async () => {
      const playerClient = createMockClient({
        registerPlayer: vi.fn().mockResolvedValue(
          mockTxResult([{ playerId: 1n }]),
        ),
      });

      const workflows = new WorkflowsClient(
        createMockClient({}) as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
        playerClient as never,
        createMockClient({}) as never,
      );

      const result = await workflows.registerPlayer({
        player: {
          owner: "0xPPPP",
          name: "Test Player",
          metadataUri: "ipfs://player",
        },
      });

      expect(result).toBeDefined();
      expect(playerClient.registerPlayer).toHaveBeenCalledOnce();
    });
  });

  describe("registerClub", () => {
    it("delegates to club registry client", async () => {
      const clubClient = createMockClient({
        registerClub: vi.fn().mockResolvedValue(
          mockTxResult([{ clubId: 1n }]),
        ),
      });

      const workflows = new WorkflowsClient(
        createMockClient({}) as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
        createMockClient({}) as never,
        clubClient as never,
      );

      const result = await workflows.registerClub({
        club: {
          owner: "0xCCCC",
          name: "Test Club",
          metadataUri: "ipfs://club",
          country: "DE",
          city: "Berlin",
          league: "Bundesliga",
          logoUri: "ipfs://logo",
          website: "https://test.club",
        },
      });

      expect(result).toBeDefined();
      expect(clubClient.registerClub).toHaveBeenCalledOnce();
    });
  });
});
