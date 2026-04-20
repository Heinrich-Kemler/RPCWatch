import { getProcessedChains } from '../src/lib/chains';
import { checkChainHealth } from '../src/lib/health';
import { notableChains } from '../src/lib/notableChains';

type HealthTestSummary = {
  generatedAt: string;
  ethereum: {
    pass: boolean;
    chainId: number;
    rpcCount: number;
    onlineCount: number;
    offlineCount: number;
    errors: string[];
  };
  singleRpcChain: {
    pass: boolean;
    chainId: number;
    name: string;
    rpcCount: number;
    onlineCount: number;
    offlineCount: number;
    errors: string[];
  };
  notableCriticalChains: Array<{
    chainId: number;
    name: string;
    publicRpcCount: number;
  }>;
};

async function main() {
  const chains = await getProcessedChains();
  const ethereum = chains.find((chain) => chain.chainId === 1);

  if (!ethereum) {
    throw new Error('Ethereum mainnet (chainId 1) was not found.');
  }

  const notableCriticalChains = chains
    .filter(
      (chain) =>
        notableChains.has(chain.chainId) &&
        !chain.isTestnet &&
        !chain.isDeprecated &&
        chain.publicRpcCount <= 2,
    )
    .map((chain) => ({
      chainId: chain.chainId,
      name: chain.name,
      publicRpcCount: chain.publicRpcCount,
    }));

  const singleRpcChain =
    chains.find(
      (chain) =>
        notableChains.has(chain.chainId) &&
        !chain.isTestnet &&
        !chain.isDeprecated &&
        chain.publicRpcCount === 1,
    ) ??
    chains.find((chain) => !chain.isTestnet && !chain.isDeprecated && chain.publicRpcCount === 1);

  if (!singleRpcChain) {
    throw new Error('Could not find a non-testnet single-RPC chain to validate.');
  }

  const [ethereumHealth, singleRpcHealth] = await Promise.all([
    checkChainHealth(ethereum),
    checkChainHealth(singleRpcChain),
  ]);

  const summary: HealthTestSummary = {
    generatedAt: new Date().toISOString(),
    ethereum: {
      pass: ethereumHealth.results.length >= 2 && ethereumHealth.onlineCount >= 2,
      chainId: ethereum.chainId,
      rpcCount: ethereum.publicRpcCount,
      onlineCount: ethereumHealth.onlineCount,
      offlineCount: ethereumHealth.offlineCount,
      errors: ethereumHealth.results
        .filter((result) => result.error)
        .map((result) => `${result.displayUrl}: ${result.error}`),
    },
    singleRpcChain: {
      pass: singleRpcHealth.results.length === 1,
      chainId: singleRpcChain.chainId,
      name: singleRpcChain.name,
      rpcCount: singleRpcChain.publicRpcCount,
      onlineCount: singleRpcHealth.onlineCount,
      offlineCount: singleRpcHealth.offlineCount,
      errors: singleRpcHealth.results
        .filter((result) => result.error)
        .map((result) => `${result.displayUrl}: ${result.error}`),
    },
    notableCriticalChains,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
