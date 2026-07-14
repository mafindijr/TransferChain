export interface ChainDeployment {
  transferChainAccessControl: string;
  transferChainConfig: string;
  playerRegistry: string;
  clubRegistry: string;
  transferMarketplace: string;
  transferAgreementManager: string;
  escrow: string;
  treasury: string;
}

export type DeploymentManifest = Record<number, ChainDeployment>;
