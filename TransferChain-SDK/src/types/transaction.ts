export interface TransactionDefaults {
  confirmations?: number;
  timeout?: number;
  gasBuffer?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}
