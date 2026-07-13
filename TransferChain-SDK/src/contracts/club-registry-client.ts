import type { ContractRegistry } from "../core/contract-registry.js";
import type { TransactionManager } from "../core/transaction-manager.js";
import { CLUB_REGISTRY_ABI } from "../abi/index.js";
import type { TransactionResult } from "../types/transaction-result.js";
import type { Club, RegisterClubParams } from "../types/club.js";
import { ClubStatus } from "../types/club.js";

/** The deployment manifest key for the ClubRegistry contract. */
const CONTRACT = "clubRegistry" as const;

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
 * Typed client for the ClubRegistry contract.
 *
 * Manages club entity registration, metadata updates, and status
 * changes. Clubs are keyed by owner address — each address may own
 * at most one club entity.
 *
 * @example
 * ```ts
 * const club = await tc.clubs.getClub("0xCAFE...");
 * console.log(club.name, club.league, club.country);
 *
 * const result = await tc.clubs.registerClub({
 *   owner: "0xCAFE...",
 *   name: "FC Example",
 *   metadataUri: "ipfs://Qm...",
 *   country: "England",
 *   city: "London",
 *   league: "Premier League",
 *   logoUri: "ipfs://QmLogo...",
 *   website: "https://fc-example.com",
 * });
 * ```
 */
export class ClubRegistryClient {
  constructor(
    private readonly contractRegistry: ContractRegistry,
    private readonly transactionManager: TransactionManager,
  ) {}

  // ── Read Methods ──────────────────────────────────────────────

  /**
   * Get the club entity owned by `owner`.
   *
   * @param owner - The address that owns the club entity.
   * @returns The full club entity.
   * @throws {ContractError} If no club is registered for the address.
   */
  async getClub(owner: string): Promise<Club> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CLUB_REGISTRY_ABI,
    );
    const result = await getMethod(contract, "getClub")(owner);
    return this.parseClub(result);
  }

  /**
   * Resolve the owner of a club by its on-chain ID.
   *
   * @param clubId - The auto-incremented club ID.
   * @returns The checksummed owner address.
   */
  async getClubOwner(clubId: bigint): Promise<string> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CLUB_REGISTRY_ABI,
    );
    return (await getMethod(contract, "getClubOwner")(clubId)) as string;
  }

  /**
   * Get the next club ID that will be assigned on registration.
   *
   * @returns The next club ID.
   */
  async getNextClubId(): Promise<bigint> {
    const contract = this.contractRegistry.getReadContract(
      CONTRACT,
      CLUB_REGISTRY_ABI,
    );
    return (await getMethod(contract, "nextClubId")()) as bigint;
  }

  // ── Write Methods ─────────────────────────────────────────────

  /**
   * Register a new club entity. Requires a signer.
   *
   * The new club is assigned `ClubStatus.Verified` by default.
   *
   * @param params - The registration parameters.
   * @returns The transaction result with decoded events.
   */
  async registerClub(params: RegisterClubParams): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CLUB_REGISTRY_ABI,
      "registerClub",
      [
        params.owner,
        params.name,
        params.metadataUri,
        params.country,
        params.city,
        params.league,
        params.logoUri,
        params.website,
      ],
    );
  }

  /**
   * Update the metadata URI for a club. Requires the caller to be
   * the club owner.
   *
   * @param owner - The address that owns the club.
   * @param metadataUri - The new metadata URI.
   * @returns The transaction result.
   */
  async updateClubMetadata(
    owner: string,
    metadataUri: string,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CLUB_REGISTRY_ABI,
      "updateClubMetadata",
      [owner, metadataUri],
    );
  }

  /**
   * Set the status of a club. Requires the contract owner.
   *
   * @param owner - The address that owns the club.
   * @param status - The new club status.
   * @returns The transaction result.
   */
  async setClubStatus(
    owner: string,
    status: ClubStatus,
  ): Promise<TransactionResult> {
    return this.transactionManager.execute(
      CONTRACT,
      CLUB_REGISTRY_ABI,
      "setClubStatus",
      [owner, status],
    );
  }

  // ── Private Helpers ───────────────────────────────────────────

  private parseClub(raw: unknown): Club {
    const r = raw as Record<string, unknown>;
    return {
      id: BigInt(r.id as bigint | number),
      owner: r.owner as string,
      name: r.name as string,
      metadataURI: r.metadataURI as string,
      country: r.country as string,
      city: r.city as string,
      league: r.league as string,
      logoURI: r.logoURI as string,
      website: r.website as string,
      status: r.status as ClubStatus,
      registeredAt: BigInt(r.registeredAt as bigint | number),
    };
  }
}
