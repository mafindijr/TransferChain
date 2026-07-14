/**
 * Re-exports of all contract ABIs from the `abi/` directory.
 *
 * Consumers can import specific ABIs:
 * ```ts
 * import { PLAYER_REGISTRY_ABI } from "@transferchain/sdk";
 * ```
 *
 * Or import the full set:
 * ```ts
 * import * as ABIS from "@transferchain/sdk/abi";
 * ```
 */
import TransferChainAccessControl from "../../abi/TransferChainAccessControl.json" with { type: "json" };
import TransferChainConfig from "../../abi/TransferChainConfig.json" with { type: "json" };
import PlayerRegistry from "../../abi/PlayerRegistry.json" with { type: "json" };
import ClubRegistry from "../../abi/ClubRegistry.json" with { type: "json" };
import TransferMarketplace from "../../abi/TransferMarketplace.json" with { type: "json" };
import TransferAgreementManager from "../../abi/TransferAgreementManager.json" with { type: "json" };
import Escrow from "../../abi/Escrow.json" with { type: "json" };
import Treasury from "../../abi/Treasury.json" with { type: "json" };

import type { ethers } from "ethers";

export type Abi = ethers.InterfaceAbi;

export const ACCESS_CONTROL_ABI: Abi = (
  TransferChainAccessControl as { abi: Abi }
).abi;
export const CONFIG_ABI: Abi = (TransferChainConfig as { abi: Abi }).abi;
export const PLAYER_REGISTRY_ABI: Abi = (PlayerRegistry as { abi: Abi }).abi;
export const CLUB_REGISTRY_ABI: Abi = (ClubRegistry as { abi: Abi }).abi;
export const MARKETPLACE_ABI: Abi = (
  TransferMarketplace as { abi: Abi }
).abi;
export const AGREEMENT_MANAGER_ABI: Abi = (
  TransferAgreementManager as { abi: Abi }
).abi;
export const ESCROW_ABI: Abi = (Escrow as { abi: Abi }).abi;
export const TREASURY_ABI: Abi = (Treasury as { abi: Abi }).abi;
