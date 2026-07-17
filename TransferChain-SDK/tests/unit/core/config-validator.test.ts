import { describe, it, expect } from "vitest";
import {
  validateConfig,
  resolveDeploymentAddress,
  validateAddress,
} from "../../../src/core/config-validator.js";
import { ValidationError } from "../../../src/errors/validation-error.js";

describe("validateConfig", () => {
  it("should pass for a valid config", () => {
    expect(() =>
      validateConfig({ chainId: 1439, rpcUrl: "https://k8s.testnet.json-rpc.injective.network" }),
    ).not.toThrow();
  });

  it("should throw for chainId <= 0", () => {
    expect(() => validateConfig({ chainId: 0, rpcUrl: "https://example.com" })).toThrow(
      ValidationError,
    );
    expect(() => validateConfig({ chainId: -1, rpcUrl: "https://example.com" })).toThrow(
      ValidationError,
    );
  });

  it("should throw for empty rpcUrl", () => {
    expect(() => validateConfig({ chainId: 1439, rpcUrl: "" })).toThrow(ValidationError);
    expect(() => validateConfig({ chainId: 1439, rpcUrl: "   " })).toThrow(
      ValidationError,
    );
  });

  it("should throw for invalid URL", () => {
    expect(() =>
      validateConfig({ chainId: 1439, rpcUrl: "not-a-url" }),
    ).toThrow(ValidationError);
  });

  it("should throw for invalid protocol", () => {
    expect(() =>
      validateConfig({ chainId: 1439, rpcUrl: "ftp://example.com" }),
    ).toThrow(ValidationError);
  });

  it("should accept http protocol", () => {
    expect(() =>
      validateConfig({ chainId: 1439, rpcUrl: "http://localhost:8545" }),
    ).not.toThrow();
  });

  it("should accept ws protocol", () => {
    expect(() =>
      validateConfig({ chainId: 1439, rpcUrl: "ws://localhost:8545" }),
    ).not.toThrow();
  });

  it("should accept wss protocol", () => {
    expect(() =>
      validateConfig({ chainId: 1439, rpcUrl: "wss://example.com" }),
    ).not.toThrow();
  });
});

describe("resolveDeploymentAddress", () => {
  it("should return user-provided address when available", () => {
    const userManifest = {
      1439: {
        transferChainAccessControl: "0x1111111111111111111111111111111111111111",
        transferChainConfig: "0x2222222222222222222222222222222222222222",
        playerRegistry: "0x3333333333333333333333333333333333333333",
        clubRegistry: "0x4444444444444444444444444444444444444444",
        transferMarketplace: "0x5555555555555555555555555555555555555555",
        transferAgreementManager: "0x6666666666666666666666666666666666666666",
        escrow: "0x7777777777777777777777777777777777777777",
        treasury: "0x8888888888888888888888888888888888888888",
      },
    };

    const address = resolveDeploymentAddress(
      1439,
      "playerRegistry",
      userManifest,
    );
    expect(address).toBe("0x3333333333333333333333333333333333333333");
  });

  it("should fall back to built-in manifest", () => {
    const address = resolveDeploymentAddress(1439, "playerRegistry");
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should throw for unsupported chain", () => {
    expect(() => resolveDeploymentAddress(9999, "playerRegistry")).toThrow(
      ValidationError,
    );
  });

  it("should prefer user manifest over built-in", () => {
    const userAddress = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const userManifest = {
      1439: {
        transferChainAccessControl: userAddress,
        transferChainConfig: "0x0000000000000000000000000000000000000000",
        playerRegistry: "0x0000000000000000000000000000000000000000",
        clubRegistry: "0x0000000000000000000000000000000000000000",
        transferMarketplace: "0x0000000000000000000000000000000000000000",
        transferAgreementManager: "0x0000000000000000000000000000000000000000",
        escrow: "0x0000000000000000000000000000000000000000",
        treasury: "0x0000000000000000000000000000000000000000",
      },
    };

    const address = resolveDeploymentAddress(
      1439,
      "transferChainAccessControl",
      userManifest,
    );
    expect(address).toBe(userAddress);
  });
});

describe("validateAddress", () => {
  it("should pass for valid checksummed address", () => {
    expect(() =>
      validateAddress("0x5FbDB2315678afecb367f032d93F642f64180aa3", "owner"),
    ).not.toThrow();
  });

  it("should pass for valid lowercase address", () => {
    expect(() =>
      validateAddress("0x5fbdb2315678afecb367f032d93f642f64180aa3", "owner"),
    ).not.toThrow();
  });

  it("should throw for invalid address", () => {
    expect(() => validateAddress("not-an-address", "owner")).toThrow(
      ValidationError,
    );
  });

  it("should accept address without 0x prefix (ethers.js is permissive)", () => {
    expect(() =>
      validateAddress("5FbDB2315678afecb367f032d93F642f64180aa3", "owner"),
    ).not.toThrow();
  });

  it("should include field name in error", () => {
    try {
      validateAddress("invalid", "seller");
      expect.fail("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).message).toContain("seller");
    }
  });
});
