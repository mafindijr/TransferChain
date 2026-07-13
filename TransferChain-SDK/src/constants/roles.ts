import { ethers } from "ethers";

/**
 * Well-known role identifiers used by {@link AccessControlClient}.
 *
 * Each value is the `keccak256` hash of the role name, matching the
 * on-chain `bytes32` constant.
 *
 * @example
 * ```ts
 * const has = await tc.accessControl.hasRole(
 *   ROLES.REGISTRY_ADMIN,
 *   "0xBEEF...",
 * );
 * ```
 */
export const ROLES = {
  /** Default admin role — can grant/revoke any role. */
  DEFAULT_ADMIN: ethers.id("DEFAULT_ADMIN_ROLE"),

  /** Admin for the PlayerRegistry and ClubRegistry. */
  REGISTRY_ADMIN: ethers.id("REGISTRY_ADMIN_ROLE"),

  /** Admin for the TransferMarketplace. */
  MARKETPLACE_ADMIN: ethers.id("MARKETPLACE_ADMIN_ROLE"),

  /** Admin for the TransferAgreementManager. */
  AGREEMENT_ADMIN: ethers.id("AGREEMENT_ADMIN_ROLE"),

  /** Manager for the Escrow contract. */
  ESCROW_MANAGER: ethers.id("ESCROW_MANAGER_ROLE"),

  /** Admin for the Treasury contract. */
  TREASURY_ADMIN: ethers.id("TREASURY_ADMIN_ROLE"),

  /** Admin for the Config contract. */
  CONFIG_ADMIN: ethers.id("CONFIG_ADMIN_ROLE"),

  /** Can pause and unpause the protocol. */
  PAUSER: ethers.id("PAUSER_ROLE"),
} as const;
