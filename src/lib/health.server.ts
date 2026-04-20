import { HEALTH_CACHE_SECONDS, type ProcessedChain } from './chains';
import { checkChainHealth, type ChainHealthResponse } from './health';

type HealthCacheEntry = {
  expiresAt: number;
  response: ChainHealthResponse;
};

type GlobalHealthState = typeof globalThis & {
  __rpcWatchHealthCache__?: Map<number, HealthCacheEntry>;
  __rpcWatchInflightChecks__?: Map<number, Promise<ChainHealthResponse>>;
};

const globalHealthState = globalThis as GlobalHealthState;
const healthCache = globalHealthState.__rpcWatchHealthCache__ ?? new Map<number, HealthCacheEntry>();
const inflightChecks =
  globalHealthState.__rpcWatchInflightChecks__ ?? new Map<number, Promise<ChainHealthResponse>>();

globalHealthState.__rpcWatchHealthCache__ = healthCache;
globalHealthState.__rpcWatchInflightChecks__ = inflightChecks;

export async function getCachedChainHealth(chain: ProcessedChain): Promise<ChainHealthResponse> {
  const now = Date.now();
  const cached = healthCache.get(chain.chainId);

  if (cached && cached.expiresAt > now) {
    return cached.response;
  }

  const inflight = inflightChecks.get(chain.chainId);

  if (inflight) {
    return inflight;
  }

  const request = checkChainHealth(chain)
    .then((response) => {
      healthCache.set(chain.chainId, {
        expiresAt: Date.now() + HEALTH_CACHE_SECONDS * 1_000,
        response,
      });

      return response;
    })
    .finally(() => {
      inflightChecks.delete(chain.chainId);
    });

  inflightChecks.set(chain.chainId, request);

  return request;
}
