import { describe, it, expect } from "vitest";
import { silentLogger } from "../../../src/logger/silent-logger.js";
import type { Logger } from "../../../src/logger/types.js";

describe("Logger", () => {
  it("should define a Logger interface with all methods", () => {
    const logger: Logger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should accept context parameter", () => {
    const calls: Array<{ msg: string; ctx?: Record<string, unknown> }> = [];
    const logger: Logger = {
      debug: (msg, ctx) => calls.push({ msg, ctx }),
      info: () => {},
      warn: () => {},
      error: () => {},
    };

    logger.debug("test message", { key: "value" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ msg: "test message", ctx: { key: "value" } });
  });
});

describe("silentLogger", () => {
  it("should not throw when called", () => {
    expect(() => silentLogger.debug("test")).not.toThrow();
    expect(() => silentLogger.info("test")).not.toThrow();
    expect(() => silentLogger.warn("test")).not.toThrow();
    expect(() => silentLogger.error("test")).not.toThrow();
  });

  it("should implement Logger interface", () => {
    const logger: Logger = silentLogger;
    expect(logger).toBeDefined();
  });
});
