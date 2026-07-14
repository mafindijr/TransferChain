import { ethers } from "ethers";
import type { ContractRegistry } from "./contract-registry.js";
import type { Logger } from "../logger/types.js";
import type { TransactionResult } from "../types/transaction-result.js";
import { normalize } from "../errors/normalize.js";
import { TransactionError } from "../errors/transaction-error.js";
import { SdkErrorCode } from "../errors/codes.js";

/**
 * Executes write transactions against on-chain contracts.
 *
 * This is an internal service — domain clients delegate write
 * operations here via `execute()`. The domain client never handles
 * the signer or provider directly.
 */
export class TransactionManager {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly logger: Logger,
  ) {}

  /**
   * Execute a write transaction against a contract.
   *
   * @param contractName - The deployment manifest key.
   * @param abi - The contract ABI.
   * @param functionName - The Solidity function to call.
   * @param args - The function arguments.
   * @returns A `TransactionResult` with the tx hash, receipt, and
   *   decoded events.
   */
  async execute<TEvent = unknown>(
    contractName: string,
    abi: ethers.InterfaceAbi,
    functionName: string,
    args: unknown[],
  ): Promise<TransactionResult<TEvent>> {
    const contract = this.contractRegistry.getWriteContract(
      contractName as never,
      abi,
    );

    this.logger.debug("Submitting transaction", {
      contractName,
      functionName,
    });

    let txResponse: ethers.TransactionResponse;
    try {
      const method = (contract as Record<string, unknown>)[functionName];
      if (typeof method !== "function") {
        throw new Error(`Contract method not found: ${functionName}`);
      }
      const result = await (method as (...a: unknown[]) => Promise<unknown>)(...args);

      if (typeof (result as Record<string, unknown>)?.wait === "function") {
        txResponse = result as ethers.TransactionResponse;
      } else {
        throw new Error("Unexpected return type from contract method");
      }
    } catch (rawError) {
      if (rawError instanceof Error && rawError.message.includes("Unexpected")) {
        throw rawError;
      }
      throw normalize(rawError as Error);
    }

    this.logger.info("Transaction submitted", {
      contractName,
      functionName,
      txHash: txResponse.hash,
    });

    const receipt = await txResponse.wait();

    if (receipt === null) {
      throw new TransactionError(
        SdkErrorCode.CONFIRMATION_TIMEOUT,
        "Transaction receipt was null",
        txResponse.hash,
      );
    }

    this.logger.info("Transaction confirmed", {
      contractName,
      functionName,
      txHash: receipt.hash,
      gasUsed: receipt.gasUsed.toString(),
    });

    const iface = new ethers.Interface(abi);
    const events = this.decodeEvents<TEvent>(iface, receipt);

    return {
      txHash: receipt.hash,
      receipt,
      events,
    };
  }

  private decodeEvents<TEvent>(
    iface: ethers.Interface,
    receipt: ethers.TransactionReceipt,
  ): TEvent[] {
    const events: TEvent[] = [];

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed !== null) {
          events.push(parsed as unknown as TEvent);
        }
      } catch {
        // Ignore logs that don't match this contract's ABI
      }
    }

    return events;
  }
}
