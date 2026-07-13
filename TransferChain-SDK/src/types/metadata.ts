export interface ProtocolHandler {
  scheme: string;
  resolve(uri: string): Promise<string>;
}

export interface MetadataConfig {
  protocols?: ProtocolHandler[];
  ipfsGateway?: string;
  cacheTtl?: number;
  cacheMaxSize?: number;
}
