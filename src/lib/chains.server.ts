import {
  CHAIN_DATA_CACHE_SECONDS,
  getChainById,
  getProcessedChainBundle,
  type ProcessedChain,
} from './chains';
import type { SourceFetchSummary } from './sources';

type Bundle = {
  chains: ProcessedChain[];
  summary: SourceFetchSummary;
};

type CacheEntry = {
  expiresAt: number;
  bundle: Bundle;
};

type GlobalCacheState = typeof globalThis & {
  __rpcWatchChainBundleCache__?: CacheEntry | null;
  __rpcWatchChainBundleInflight__?: Promise<Bundle> | null;
};

const state = globalThis as GlobalCacheState;

async function computeBundle(): Promise<Bundle> {
  const result = await getProcessedChainBundle();
  return result;
}

export async function getCachedChainBundle(): Promise<Bundle> {
  const now = Date.now();
  const cached = state.__rpcWatchChainBundleCache__;
  if (cached && cached.expiresAt > now) {
    return cached.bundle;
  }

  const inflight = state.__rpcWatchChainBundleInflight__;
  if (inflight) {
    return inflight;
  }

  const request = computeBundle()
    .then((bundle) => {
      state.__rpcWatchChainBundleCache__ = {
        expiresAt: Date.now() + CHAIN_DATA_CACHE_SECONDS * 1_000,
        bundle,
      };
      return bundle;
    })
    .finally(() => {
      state.__rpcWatchChainBundleInflight__ = null;
    });

  state.__rpcWatchChainBundleInflight__ = request;
  return request;
}

export async function getCachedChains(): Promise<ProcessedChain[]> {
  const { chains } = await getCachedChainBundle();
  return chains;
}

export async function getCachedChainById(chainId: number): Promise<ProcessedChain | undefined> {
  const chains = await getCachedChains();
  return getChainById(chains, chainId);
}
