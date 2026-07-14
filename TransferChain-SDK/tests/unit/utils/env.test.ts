import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fromEnv } from "../../../src/utils/env.js";

describe("fromEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should load config from environment variables", () => {
    process.env.TRANSFERCHAIN_CHAIN_ID = "8888";
    process.env.TRANSFERCHAIN_RPC_URL = "https://evm.testnet.injective.network";
    process.env.TRANSFERCHAIN_PRIVATE_KEY = "0xsecret";

    const config = fromEnv();
    expect(config.chainId).toBe(8888);
    expect(config.rpcUrl).toBe("https://evm.testnet.injective.network");
    expect(config.privateKey).toBe("0xsecret");
  });

  it("should omit privateKey when not set", () => {
    process.env.TRANSFERCHAIN_CHAIN_ID = "8888";
    process.env.TRANSFERCHAIN_RPC_URL = "https://evm.testnet.injective.network";
    delete process.env.TRANSFERCHAIN_PRIVATE_KEY;

    const config = fromEnv();
    expect(config.privateKey).toBeUndefined();
  });

  it("should throw when TRANSFERCHAIN_CHAIN_ID is missing", () => {
    delete process.env.TRANSFERCHAIN_CHAIN_ID;
    process.env.TRANSFERCHAIN_RPC_URL = "https://example.com";

    expect(() => fromEnv()).toThrow("TRANSFERCHAIN_CHAIN_ID");
  });

  it("should throw when TRANSFERCHAIN_RPC_URL is missing", () => {
    process.env.TRANSFERCHAIN_CHAIN_ID = "8888";
    delete process.env.TRANSFERCHAIN_RPC_URL;

    expect(() => fromEnv()).toThrow("TRANSFERCHAIN_RPC_URL");
  });

  it("should throw when TRANSFERCHAIN_CHAIN_ID is not a number", () => {
    process.env.TRANSFERCHAIN_CHAIN_ID = "not-a-number";
    process.env.TRANSFERCHAIN_RPC_URL = "https://example.com";

    expect(() => fromEnv()).toThrow("valid integer");
  });
});
