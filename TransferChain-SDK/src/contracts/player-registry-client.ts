import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { PLAYER_REGISTRY_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";
import type { Player, RegisterPlayerParams } from "../types/player.js";
import { PlayerStatus } from "../types/player.js";

/** The deployment manifest key for the PlayerRegistry contract. */
const CONTRACT = "playerRegistry" as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContractMethod = (...args: any[]) => Promise<any>;

function getMethod(
  contract: { [key: string]: unknown },
  name: string,
): ContractMethod {
  const fn = contract[name];
  if (typeof fn !== "function") {
    throw new Error(`Contract method not found: ${name}`);
  }
  return fn as ContractMethod;
}

/**
 * Typed client for the PlayerRegistry contract.
 *
 * Manages player entity registration, metadata updates, and status
 * changes. Players are keyed by owner address — each address may own
 * at most one player entity.
 *
 * @example
 * ```ts
 * const player = await tc.players.getPlayer("0xBEEF...");
 * console.log(player.name, player.status);
 *
 * const result = await tc.players.registerPlayer({
 *   owner: "0xBEEF...",
 *   name: "Alice",
 *   metadataUri: "ipfs://Qm...",
 * });
 * ```
 */
export class PlayerRegistryClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Get the player entity owned by `owner`.
   *
   * @param owner - The address that owns the player entity.
   * @returns The full player entity.
   * @throws {ContractError} If no player is registered for the address.
   */
  async getPlayer(owner: string): Promise<Player> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      PLAYER_REGISTRY_ABI,
    );
    const result = await getMethod(contract, "getPlayer")(owner);
    return this.parsePlayer(result);
  }

  /**
   * Resolve the owner of a player by its on-chain ID.
   *
   * @param playerId - The auto-incremented player ID.
   * @returns The checksummed owner address.
   */
  async getPlayerOwner(playerId: bigint): Promise<string> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      PLAYER_REGISTRY_ABI,
    );
    return (await getMethod(contract, "getPlayerOwner")(playerId)) as string;
  }

  /**
   * Get the next player ID that will be assigned on registration.
   *
   * @returns The next player ID.
   */
  async getNextPlayerId(): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      PLAYER_REGISTRY_ABI,
    );
    return (await getMethod(contract, "nextPlayerId")()) as bigint;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Register a new player entity. Requires a signer.
   *
   * The new player is assigned `PlayerStatus.Active` by default.
   *
   * @param params - The registration parameters.
   * @returns The transaction result with decoded events.
   */
  async registerPlayer(
    params: RegisterPlayerParams,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      PLAYER_REGISTRY_ABI,
      "registerPlayer",
      [params.owner, params.metadataUri, params.name],
    );
  }

  /**
   * Update the metadata URI for a player. Requires the caller to be
   * the player owner.
   *
   * @param owner - The address that owns the player.
   * @param metadataUri - The new metadata URI.
   * @returns The transaction result.
   */
  async updatePlayerMetadata(
    owner: string,
    metadataUri: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      PLAYER_REGISTRY_ABI,
      "updatePlayerMetadata",
      [owner, metadataUri],
    );
  }

  /**
   * Set the status of a player. Requires the contract owner.
   *
   * @param owner - The address that owns the player.
   * @param status - The new player status.
   * @returns The transaction result.
   */
  async setPlayerStatus(
    owner: string,
    status: PlayerStatus,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      PLAYER_REGISTRY_ABI,
      "setPlayerStatus",
      [owner, status],
    );
  }

  // ── Private Helpers ───────────────────────────────────────────

  private parsePlayer(raw: unknown): Player {
    const r = raw as Record<string, unknown>;
    return {
      id: BigInt(r.id as bigint | number),
      owner: r.owner as string,
      name: r.name as string,
      metadataURI: r.metadataURI as string,
      status: r.status as PlayerStatus,
      registeredAt: BigInt(r.registeredAt as bigint | number),
    };
  }
}
