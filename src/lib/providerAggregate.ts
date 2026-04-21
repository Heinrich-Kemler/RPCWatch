import type { ProcessedChain } from './chains';
import { SIGNIFICANT_TVL_USD } from './chains';

export type ProviderAggregate = {
  id: string;
  name: string;
  verified: boolean;
  /** Chains where this is the ONLY public provider. */
  soleProviderChains: ProcessedChain[];
  /** Chains where this is one of several providers. */
  sharedProviderChains: ProcessedChain[];
  /** Total public RPC URLs operated across all chains. */
  totalUrls: number;
  /** Sum of TVL from chains where this provider is the sole provider. */
  soleProviderTvlUsd: number;
  /** Sum of TVL across all chains touched (sole + shared). */
  totalTvlUsd: number;
  /** How many chains total (sole + shared). */
  chainCount: number;
};

export function buildProviderAggregates(chains: ProcessedChain[]): ProviderAggregate[] {
  const byId = new Map<string, ProviderAggregate>();

  for (const chain of chains) {
    if (chain.isDeprecated || chain.isTestnet) continue;
    if (chain.publicRpcCount === 0) continue;

    const isSole = chain.distinctProviders === 1;
    for (const group of chain.providerGroups) {
      const entry = byId.get(group.id);
      const baseline: ProviderAggregate =
        entry ?? {
          id: group.id,
          name: group.name,
          verified: group.verified,
          soleProviderChains: [],
          sharedProviderChains: [],
          totalUrls: 0,
          soleProviderTvlUsd: 0,
          totalTvlUsd: 0,
          chainCount: 0,
        };

      baseline.totalUrls += group.urls.length;
      baseline.chainCount += 1;
      if (chain.tvlUsd !== null && chain.tvlUsd > 0) {
        baseline.totalTvlUsd += chain.tvlUsd;
      }
      if (isSole) {
        baseline.soleProviderChains.push(chain);
        if (chain.tvlUsd !== null && chain.tvlUsd > 0) {
          baseline.soleProviderTvlUsd += chain.tvlUsd;
        }
      } else {
        baseline.sharedProviderChains.push(chain);
      }

      byId.set(group.id, baseline);
    }
  }

  return Array.from(byId.values()).sort((left, right) => {
    // Rank by TVL exclusively served first — that's the real blast radius.
    if (left.soleProviderTvlUsd !== right.soleProviderTvlUsd) {
      return right.soleProviderTvlUsd - left.soleProviderTvlUsd;
    }
    // Then by number of sole-provider chains.
    if (left.soleProviderChains.length !== right.soleProviderChains.length) {
      return right.soleProviderChains.length - left.soleProviderChains.length;
    }
    // Then by total URLs (broadest footprint).
    if (left.totalUrls !== right.totalUrls) {
      return right.totalUrls - left.totalUrls;
    }
    return left.name.localeCompare(right.name);
  });
}

export function findProviderAggregate(
  chains: ProcessedChain[],
  providerId: string,
): ProviderAggregate | null {
  const aggregates = buildProviderAggregates(chains);
  return aggregates.find((entry) => entry.id === providerId) ?? null;
}

export function hasSignificantTvl(aggregate: ProviderAggregate): boolean {
  return aggregate.soleProviderTvlUsd >= SIGNIFICANT_TVL_USD;
}
