import { unstable_cache } from 'next/cache';

import { CHAIN_DATA_CACHE_SECONDS, getProcessedChains, getChainById, type ProcessedChain } from './chains';

const getCachedChainsInternal = unstable_cache(
  async () => getProcessedChains(),
  ['rpc-watch:chains'],
  {
    revalidate: CHAIN_DATA_CACHE_SECONDS,
  },
);

export async function getCachedChains(): Promise<ProcessedChain[]> {
  return getCachedChainsInternal();
}

export async function getCachedChainById(chainId: number): Promise<ProcessedChain | undefined> {
  const chains = await getCachedChains();
  return getChainById(chains, chainId);
}
