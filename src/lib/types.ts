// Type definitions matching the structure of chains.json
// This is the single source of truth for chain/provider shapes across the app

export interface ProviderPattern {
  patterns: string[];
  label: string;
}

export interface ChainEntry {
  id: string;
  name: string;
  slug: string;
  pocketUrl: string;
  chainId?: number;
  nativeCurrency: string;
  explorer?: string;
  logoUrl?: string;
  rpcType?: "evm" | "cosmos" | "solana" | "near" | "sui" | "tron" | "radix";
  isTestnet?: boolean;
  providers: Record<string, ProviderPattern>;
  wagmiChain?: string;
  viemChain?: string;
}

export interface ChainsData {
  _metadata: {
    version: string;
    lastUpdated: string;
    source: string;
    baseUrl: string;
    description: string;
  };
  evm: ChainEntry[];
  cosmos: ChainEntry[];
  other: ChainEntry[];
  testnets: ChainEntry[];
}

export type FrameworkId = "ethers" | "viem" | "wagmi" | "web3py" | "curl";

export interface DetectionResult {
  chain: ChainEntry;
  providerName: string;
  providerLabel: string;
  matchedPattern: string;
}
