/**
 * Generates clean ABI JSON files from Foundry build output.
 *
 * Usage:
 *   node scripts/generate-abis.mjs
 *
 * Reads from TransferChain-Contracts/out/ and writes to abi/.
 * Run after `forge build` in the Contracts repo.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CONTRACTS_DIR = join(
  __dirname,
  "..",
  "..",
  "TransferChain-Contracts",
  "out",
);

const ABI_DIR = join(__dirname, "..", "abi");

const CONTRACTS = {
  TransferChainAccessControl: "TransferChainAccessControl",
  TransferChainConfig: "TransferChainConfig",
  PlayerRegistry: "PlayerRegistry",
  ClubRegistry: "ClubRegistry",
  TransferMarketplace: "TransferMarketplace",
  TransferAgreementManager: "TransferAgreementManager",
  Escrow: "Escrow",
  Treasury: "Treasury",
};

mkdirSync(ABI_DIR, { recursive: true });

for (const [name, fileName] of Object.entries(CONTRACTS)) {
  const sourcePath = join(
    CONTRACTS_DIR,
    `${fileName}.sol`,
    `${fileName}.json`,
  );

  const raw = readFileSync(sourcePath, "utf-8");
  const parsed = JSON.parse(raw);

  const output = { abi: parsed.abi };

  const destPath = join(ABI_DIR, `${name}.json`);
  writeFileSync(destPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`✓ ${name} (${parsed.abi.length} entries)`);
}

console.log(`\nGenerated ${Object.keys(CONTRACTS).length} ABI files in abi/`);
