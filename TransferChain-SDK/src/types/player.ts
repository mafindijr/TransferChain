/**
 * Mirrors the Solidity `PlayerStatus` enum in `PlayerRegistry.sol`.
 *
 * @see PlayerRegistry.PlayerStatus
 */
export enum PlayerStatus {
  Active = 0,
  Suspended = 1,
  Inactive = 2,
}

/**
 * On-chain player entity returned by `PlayerRegistry.getPlayer()`.
 *
 * All fields are read directly from the smart contract and match the
 * Solidity `Player` struct.
 */
export interface Player {
  /** On-chain auto-incremented player ID. */
  id: bigint;
  /** The address that owns this player entity. */
  owner: string;
  /** Human-readable player name. */
  name: string;
  /** IPFS or HTTP URI pointing to the player's metadata JSON. */
  metadataURI: string;
  /** Current status of the player. */
  status: PlayerStatus;
  /** Unix timestamp (seconds) when the player was registered. */
  registeredAt: bigint;
}

/**
 * Parameters for `PlayerRegistryClient.registerPlayer()`.
 *
 * @see PlayerRegistry.registerPlayer
 */
export interface RegisterPlayerParams {
  /** The address that will own the player entity. */
  owner: string;
  /** Human-readable player name. */
  name: string;
  /** IPFS or HTTP URI pointing to the player's metadata JSON. */
  metadataUri: string;
}
