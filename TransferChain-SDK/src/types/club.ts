/**
 * Mirrors the Solidity `ClubStatus` enum in `ClubRegistry.sol`.
 *
 * @see ClubRegistry.ClubStatus
 */
export enum ClubStatus {
  Unverified = 0,
  Verified = 1,
  Suspended = 2,
  Inactive = 3,
}

/**
 * On-chain club entity returned by `ClubRegistry.getClub()`.
 *
 * All fields are read directly from the smart contract and match the
 * Solidity `Club` struct.
 */
export interface Club {
  /** On-chain auto-incremented club ID. */
  id: bigint;
  /** The address that owns this club entity. */
  owner: string;
  /** Human-readable club name. */
  name: string;
  /** IPFS or HTTP URI pointing to the club's metadata JSON. */
  metadataURI: string;
  /** Country of the club. */
  country: string;
  /** City of the club. */
  city: string;
  /** League the club belongs to. */
  league: string;
  /** IPFS or HTTP URI pointing to the club's logo. */
  logoURI: string;
  /** Club website URL. */
  website: string;
  /** Current verification status of the club. */
  status: ClubStatus;
  /** Unix timestamp (seconds) when the club was registered. */
  registeredAt: bigint;
}

/**
 * Parameters for `ClubRegistryClient.registerClub()`.
 *
 * @see ClubRegistry.registerClub
 */
export interface RegisterClubParams {
  /** The address that will own the club entity. */
  owner: string;
  /** Human-readable club name. */
  name: string;
  /** IPFS or HTTP URI pointing to the club's metadata JSON. */
  metadataUri: string;
  /** Country of the club. */
  country: string;
  /** City of the club. */
  city: string;
  /** League the club belongs to. */
  league: string;
  /** IPFS or HTTP URI pointing to the club's logo. */
  logoUri: string;
  /** Club website URL. */
  website: string;
}
