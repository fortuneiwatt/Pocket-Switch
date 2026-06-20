import type { ChainEntry, FrameworkId } from "./types";

export interface GeneratedSnippet {
  framework: FrameworkId;
  label: string;
  code: string;
  language: string; // for syntax highlighting
}

const FRAMEWORK_LABELS: Record<FrameworkId, string> = {
  ethers: "ethers.js",
  viem: "viem",
  wagmi: "wagmi",
  web3py: "web3.py",
  curl: "curl",
};

/**
 * Generates the replacement code snippet for a given chain + framework.
 * Each branch mirrors the real-world integration pattern for that library,
 * with only the RPC URL (and chain import, where relevant) swapped to Pocket.
 *
 * Non-EVM chains (rpcType !== "evm" and not undefined) fall back to curl-only
 * guidance for ethers/viem/wagmi since those libraries are EVM-specific.
 */
export function generateSnippet(
  chain: ChainEntry,
  framework: FrameworkId
): GeneratedSnippet {
  const url = chain.pocketUrl;
  const isEvm = !chain.rpcType || chain.rpcType === "evm";
  const wagmiChain = chain.wagmiChain ?? "mainnet";
  const viemChain = chain.viemChain ?? "mainnet";

  switch (framework) {
    case "ethers": {
      if (!isEvm) {
        return {
          framework,
          label: FRAMEWORK_LABELS[framework],
          language: "javascript",
          code: `// ethers.js is EVM-only and does not support ${chain.name}.\n// Use the curl tab to call this chain's native RPC directly.`,
        };
      }
      return {
        framework,
        label: FRAMEWORK_LABELS[framework],
        language: "javascript",
        code: `import { JsonRpcProvider } from "ethers";

// ${chain.name} — no API key needed
const provider = new JsonRpcProvider("${url}");
const blockNumber = await provider.getBlockNumber();`,
      };
    }

    case "viem": {
      if (!isEvm) {
        return {
          framework,
          label: FRAMEWORK_LABELS[framework],
          language: "javascript",
          code: `// viem is EVM-only and does not support ${chain.name}.\n// Use the curl tab to call this chain's native RPC directly.`,
        };
      }
      return {
        framework,
        label: FRAMEWORK_LABELS[framework],
        language: "javascript",
        code: `import { createPublicClient, http } from "viem";
import { ${viemChain} } from "viem/chains";

const client = createPublicClient({
  chain: ${viemChain},
  transport: http("${url}"),
});`,
      };
    }

    case "wagmi": {
      if (!isEvm) {
        return {
          framework,
          label: FRAMEWORK_LABELS[framework],
          language: "javascript",
          code: `// wagmi is EVM-only and does not support ${chain.name}.\n// Use the curl tab to call this chain's native RPC directly.`,
        };
      }
      return {
        framework,
        label: FRAMEWORK_LABELS[framework],
        language: "javascript",
        code: `import { createConfig, http } from "wagmi";
import { ${wagmiChain} } from "wagmi/chains";

export const config = createConfig({
  chains: [${wagmiChain}],
  transports: {
    [${wagmiChain}.id]: http("${url}"),
  },
});`,
      };
    }

    case "web3py": {
      if (!isEvm) {
        return {
          framework,
          label: FRAMEWORK_LABELS[framework],
          language: "python",
          code: `# web3.py is EVM-only and does not support ${chain.name}.\n# Use the curl tab to call this chain's native RPC directly.`,
        };
      }
      return {
        framework,
        label: FRAMEWORK_LABELS[framework],
        language: "python",
        code: `from web3 import Web3

# ${chain.name} — no API key needed
w3 = Web3(Web3.HTTPProvider("${url}"))
print(w3.eth.block_number)`,
      };
    }

    case "curl": {
      const body = isEvm
        ? `{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}`
        : `{"jsonrpc":"2.0","method":"status","params":[],"id":1}`;
      return {
        framework,
        label: FRAMEWORK_LABELS[framework],
        language: "bash",
        code: `# ${chain.name} — standard JSON-RPC, no API key needed
curl -X POST ${url} \\
  -H "Content-Type: application/json" \\
  -d '${body}'`,
      };
    }
  }
}

export const ALL_FRAMEWORKS: FrameworkId[] = [
  "ethers",
  "viem",
  "wagmi",
  "web3py",
  "curl",
];

export function generateAllSnippets(
  chain: ChainEntry
): Record<FrameworkId, GeneratedSnippet> {
  const result = {} as Record<FrameworkId, GeneratedSnippet>;
  for (const fw of ALL_FRAMEWORKS) {
    result[fw] = generateSnippet(chain, fw);
  }
  return result;
}
