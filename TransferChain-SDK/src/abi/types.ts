/**
 * A parsed ABI entry — one element of the ABI array.
 * This type mirrors the JSON ABI format used by ethers.js v6.
 */
export type AbiEntry = Record<string, unknown>;

/**
 * Parsed contract ABI — the `{ "abi": [...] }` shape stored in each
 * JSON file under `abi/`.
 */
export interface ParsedAbi {
  readonly abi: readonly AbiEntry[];
}
