import { describe, it, expect } from "vitest";
import { Wallet } from "ethers";
import { TransferChain } from "../../../src/core/transfer-chain.js";
import { ValidationError } from "../../../src/errors/validation-error.js";

const VALID_CONFIG = {
  chainId: 1439,
  rpcUrl: "https://k8s.testnet.json-rpc.injective.network",
};

describe("TransferChain", () => {
  describe("constructor", () => {
    it("should create an instance with valid config", () => {
      const tc = new TransferChain(VALID_CONFIG);
      expect(tc).toBeDefined();
      tc.destroy();
    });

    it("should set chainId from config", () => {
      const tc = new TransferChain(VALID_CONFIG);
      expect(tc.chainId).toBe(1439);
      tc.destroy();
    });

    it("should throw ValidationError for invalid chainId", () => {
      expect(
        () =>
          new TransferChain({
            chainId: 0,
            rpcUrl: "https://example.com",
          }),
      ).toThrow(ValidationError);
    });

    it("should throw ValidationError for empty rpcUrl", () => {
      expect(
        () =>
          new TransferChain({
            chainId: 1439,
            rpcUrl: "",
          }),
      ).toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid URL", () => {
      expect(
        () =>
          new TransferChain({
            chainId: 1439,
            rpcUrl: "not-a-url",
          }),
      ).toThrow(ValidationError);
    });

    it("should accept http localhost URL", () => {
      const tc = new TransferChain({
        chainId: 31337,
        rpcUrl: "http://localhost:8545",
      });
      expect(tc.chainId).toBe(31337);
      tc.destroy();
    });
  });

  describe("hasSigner", () => {
    it("should return false in read-only mode", () => {
      const tc = new TransferChain(VALID_CONFIG);
      expect(tc.hasSigner()).toBe(false);
      tc.destroy();
    });

    it("should return true when privateKey is provided", () => {
      const tc = new TransferChain({
        ...VALID_CONFIG,
        privateKey:
          "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      });
      expect(tc.hasSigner()).toBe(true);
      tc.destroy();
    });

    it("should return true when pre-built signer is provided", () => {
      const wallet = Wallet.createRandom();
      const tc = new TransferChain({
        ...VALID_CONFIG,
        signer: wallet,
      });
      expect(tc.hasSigner()).toBe(true);
      tc.destroy();
    });
  });

  describe("destroy", () => {
    it("should be callable without error", () => {
      const tc = new TransferChain(VALID_CONFIG);
      expect(() => tc.destroy()).not.toThrow();
    });

    it("should make hasSigner throw after destroy", () => {
      const tc = new TransferChain(VALID_CONFIG);
      tc.destroy();
      expect(() => tc.hasSigner()).toThrow("destroyed");
    });

    it("should be idempotent", () => {
      const tc = new TransferChain(VALID_CONFIG);
      tc.destroy();
      expect(() => tc.destroy()).not.toThrow();
    });
  });

  describe("immutability", () => {
    it("should have chainId as a readonly property", () => {
      const tc = new TransferChain(VALID_CONFIG);
      expect(tc.chainId).toBe(1439);
      tc.destroy();
    });
  });
});
