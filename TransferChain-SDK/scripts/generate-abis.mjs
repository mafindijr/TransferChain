/**
 * Generates clean ABI JSON files and the built-in deployment manifest
 * from Foundry build output and deployment artifacts.
 *
 * Usage:
 *   node scripts/generate-abis.mjs
 *
 * Reads ABIs from TransferChain-Contracts/out/ and writes to abi/.
 * Reads deployment manifests from TransferChain-Contracts/deployments/
 *   and writes to src/constants/manifest.ts.
 * Run after `forge build` and `forge script Deploy.s.sol` in the Contracts repo.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
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

const DEPLOYMENTS_DIR = join(
  __dirname,
  "..",
  "..",
  "TransferChain-Contracts",
  "deployments",
);

const ABI_DIR = join(__dirname, "..", "abi");

const MANIFEST_PATH = join(
  __dirname,
  "..",
  "src",
  "constants",
  "manifest.ts",
);

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

/**
 * Convert a PascalCase Solidity contract name to the camelCase
 * key used in the SDK's ChainDeployment interface.
 *
 * Mapping:
 *   TransferChainAccessControl -> transferChainAccessControl
 *   TransferChainConfig        -> transferChainConfig
 *   PlayerRegistry             -> playerRegistry
 *   ClubRegistry               -> clubRegistry
 *   TransferMarketplace        -> transferMarketplace
 *   TransferAgreementManager   -> transferAgreementManager
 *   Escrow                     -> escrow
 *   Treasury                   -> treasury
 */
function solidityToCamelCase(name) {
  if (name === "TransferChainAccessControl") return "transferChainAccessControl";
  if (name === "TransferChainConfig") return "transferChainConfig";
  if (name === "PlayerRegistry") return "playerRegistry";
  if (name === "ClubRegistry") return "clubRegistry";
  if (name === "TransferMarketplace") return "transferMarketplace";
  if (name === "TransferAgreementManager") return "transferAgreementManager";
  if (name === "Escrow") return "escrow";
  if (name === "Treasury") return "treasury";
  return name.charAt(0).toLowerCase() + name.slice(1);
}

// ── ABI Generation ──────────────────────────────────────────

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

  console.log(`  ABI  ${name} (${parsed.abi.length} entries)`);
}

console.log(`\nGenerated ${Object.keys(CONTRACTS).length} ABI files in abi/`);

// ── Deployment Manifest Generation ──────────────────────────

try {
  const deploymentFiles = readdirSync(DEPLOYMENTS_DIR).filter((f) =>
    f.endsWith(".json"),
  );

  if (deploymentFiles.length === 0) {
    console.log("\nNo deployment manifests found in deployments/. Skipping.");
  } else {
    const chains = {};

    for (const file of deploymentFiles) {
      const filePath = join(DEPLOYMENTS_DIR, file);
      const raw = readFileSync(filePath, "utf-8");
      const manifest = JSON.parse(raw);

      const chainId = manifest.chainId;
      if (chainId === undefined) {
        console.warn(`  Skipping ${file}: no chainId field`);
        continue;
      }

      const deployment = {};
      for (const [solidityName, info] of Object.entries(manifest.contracts)) {
        const key = solidityToCamelCase(solidityName);
        deployment[key] = info.address;
      }

      chains[chainId] = deployment;
      console.log(
        `  Manifest  chain ${chainId} (${Object.keys(deployment).length} contracts)`,
      );
    }

    const chainEntries = Object.entries(chains)
      .map(([chainId, deployment]) => {
        const contractLines = Object.entries(deployment)
          .map(([key, addr]) => `    ${key}: "${addr}",`)
          .join("\n");
        return `  ${chainId}: {\n${contractLines}\n  }`;
      })
      .join(",\n");

    const manifestContent = `import type { DeploymentManifest } from "../types/deployment.js";

export const BUILTIN_MANIFEST: DeploymentManifest = {
${chainEntries},
};
`;

    writeFileSync(MANIFEST_PATH, manifestContent + "\n");
    console.log(
      `\nUpdated ${MANIFEST_PATH} with ${Object.keys(chains).length} chain(s)`,
    );
  }
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(
      "\nDeployments directory not found. Skipping manifest generation.",
    );
  } else {
    console.error("Error generating manifest:", err);
  }
}
