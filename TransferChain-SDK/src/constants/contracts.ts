/**
 * Mapping from SDK contract names (used in {@link ContractRegistry}) to
 * the corresponding Foundry/Solidity contract names.
 *
 * This is the single source of truth for contract identity across the SDK.
 */
export const CONTRACT_NAMES = {
  ACCESS_CONTROL: "TransferChainAccessControl",
  CONFIG: "TransferChainConfig",
  PLAYER_REGISTRY: "PlayerRegistry",
  CLUB_REGISTRY: "ClubRegistry",
  MARKETPLACE: "TransferMarketplace",
  AGREEMENT_MANAGER: "TransferAgreementManager",
  ESCROW: "Escrow",
  TREASURY: "Treasury",
} as const;

/** Union of all SDK contract name keys. */
export type ContractNameKey = keyof typeof CONTRACT_NAMES;

/** Union of all Solidity contract name values. */
export type SolidityContractName =
  (typeof CONTRACT_NAMES)[ContractNameKey];
