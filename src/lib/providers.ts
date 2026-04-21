/**
 * Hand-curated hostname → provider map.
 *
 * Many public RPC lists stack multiple URLs that all resolve to the same
 * operator (dRPC, PublicNode, Ankr, Conduit, Caldera, …). Counting URLs
 * as independent providers over-states redundancy. This map collapses
 * URLs to their real operator so `distinctProviders` reflects actual
 * infrastructure diversity.
 *
 * Matching logic (`identifyProvider`):
 *   1. try exact apex match (last two hostname labels)
 *   2. try a small set of subdomain-specific overrides
 *   3. fall back to the apex itself as a synthetic provider id
 *
 * When the provider is unknown we return the apex as the identity — two
 * URLs on the same unknown apex still count as one provider, two URLs on
 * different unknown apexes count as two.
 */

type ProviderDef = {
  /** Short human label shown in the UI. */
  name: string;
  /** Stable id used for equality (grouping RPCs). */
  id: string;
  /** Short category. */
  kind: 'public-rpc-aggregator' | 'rollup-infra' | 'appchain-infra' | 'foundation' | 'other';
};

/**
 * Keyed by apex hostname (last two labels, lower-case).
 */
const APEX_PROVIDERS: Record<string, ProviderDef> = {
  // Public multi-chain aggregators — large consolidation risk.
  'drpc.org': { name: 'dRPC', id: 'drpc', kind: 'public-rpc-aggregator' },
  'publicnode.com': { name: 'PublicNode', id: 'publicnode', kind: 'public-rpc-aggregator' },
  'ankr.com': { name: 'Ankr', id: 'ankr', kind: 'public-rpc-aggregator' },
  '1rpc.io': { name: '1RPC', id: '1rpc', kind: 'public-rpc-aggregator' },
  'blastapi.io': { name: 'Blast API', id: 'blastapi', kind: 'public-rpc-aggregator' },
  'blockpi.network': { name: 'BlockPI', id: 'blockpi', kind: 'public-rpc-aggregator' },
  'tenderly.co': { name: 'Tenderly', id: 'tenderly', kind: 'public-rpc-aggregator' },
  'onfinality.io': { name: 'OnFinality', id: 'onfinality', kind: 'public-rpc-aggregator' },
  'omniatech.io': { name: 'Omnia', id: 'omnia', kind: 'public-rpc-aggregator' },
  'tatum.io': { name: 'Tatum', id: 'tatum', kind: 'public-rpc-aggregator' },
  'pocket.network': { name: 'Pocket Network', id: 'pocket', kind: 'public-rpc-aggregator' },
  'dwellir.com': { name: 'Dwellir', id: 'dwellir', kind: 'public-rpc-aggregator' },
  'therpc.io': { name: 'TheRPC', id: 'therpc', kind: 'public-rpc-aggregator' },
  'nodies.app': { name: 'Nodies DLB', id: 'nodies', kind: 'public-rpc-aggregator' },
  '4everland.org': { name: '4EVERLAND', id: '4everland', kind: 'public-rpc-aggregator' },
  'zan.top': { name: 'ZAN', id: 'zan', kind: 'public-rpc-aggregator' },
  'gateway.fm': { name: 'Gateway.fm', id: 'gateway.fm', kind: 'public-rpc-aggregator' },
  'llamarpc.com': { name: 'LlamaNodes', id: 'llamanodes', kind: 'public-rpc-aggregator' },
  'sentio.xyz': { name: 'Sentio', id: 'sentio', kind: 'public-rpc-aggregator' },
  'moralis.io': { name: 'Moralis', id: 'moralis', kind: 'public-rpc-aggregator' },
  'chainstacklabs.com': { name: 'Chainstack', id: 'chainstack', kind: 'public-rpc-aggregator' },
  'chainstack.com': { name: 'Chainstack', id: 'chainstack', kind: 'public-rpc-aggregator' },
  'infura.io': { name: 'Infura', id: 'infura', kind: 'public-rpc-aggregator' },
  'alchemy.com': { name: 'Alchemy', id: 'alchemy', kind: 'public-rpc-aggregator' },
  'alchemyapi.io': { name: 'Alchemy', id: 'alchemy', kind: 'public-rpc-aggregator' },
  'quiknode.pro': { name: 'QuickNode', id: 'quicknode', kind: 'public-rpc-aggregator' },
  'thirdweb.com': { name: 'thirdweb', id: 'thirdweb', kind: 'public-rpc-aggregator' },
  'leorpc.com': { name: 'LeoRPC', id: 'leorpc', kind: 'public-rpc-aggregator' },
  'nownodes.io': { name: 'NOWNodes', id: 'nownodes', kind: 'public-rpc-aggregator' },
  'getblock.io': { name: 'GetBlock', id: 'getblock', kind: 'public-rpc-aggregator' },
  'lavanet.xyz': { name: 'Lava Network', id: 'lava', kind: 'public-rpc-aggregator' },
  'subquery.network': { name: 'SubQuery', id: 'subquery', kind: 'public-rpc-aggregator' },
  'helium.io': { name: 'Helium', id: 'helium', kind: 'public-rpc-aggregator' },

  // Rollup-as-a-service — every rollup they host shares this infra.
  'conduit.xyz': { name: 'Conduit', id: 'conduit', kind: 'rollup-infra' },
  'caldera.xyz': { name: 'Caldera', id: 'caldera', kind: 'rollup-infra' },
  'calderachain.xyz': { name: 'Caldera', id: 'caldera', kind: 'rollup-infra' },
  'alt.technology': { name: 'AltLayer', id: 'altlayer', kind: 'rollup-infra' },
  'gelato.digital': { name: 'Gelato', id: 'gelato', kind: 'rollup-infra' },
  'gelato.cloud': { name: 'Gelato', id: 'gelato', kind: 'rollup-infra' },
  'ankr.network': { name: 'Ankr', id: 'ankr', kind: 'public-rpc-aggregator' },

  // Appchain / ecosystem infra.
  'skalenodes.com': { name: 'SKALE', id: 'skale', kind: 'appchain-infra' },
  'avax.network': { name: 'Avalanche Foundation', id: 'avax', kind: 'foundation' },

  // Major foundations for non-EVM chains (used by the seed table).
  'solana.com': { name: 'Solana Foundation', id: 'solana-foundation', kind: 'foundation' },
  'sui.io': { name: 'Mysten Labs', id: 'mysten-labs', kind: 'foundation' },
  'aptoslabs.com': { name: 'Aptos Foundation', id: 'aptos-foundation', kind: 'foundation' },
  'near.org': { name: 'Near Foundation', id: 'near-foundation', kind: 'foundation' },
  'toncenter.com': { name: 'TON Foundation', id: 'ton-foundation', kind: 'foundation' },
  'trongrid.io': { name: 'TronGrid', id: 'trongrid', kind: 'foundation' },
  'hiro.so': { name: 'Hiro Systems', id: 'hiro', kind: 'foundation' },
};

/**
 * Subdomain overrides — matched before apex lookup. Useful when the apex
 * is shared across products (e.g. a project's apex hosts both their
 * chain's native RPC and an unrelated service).
 */
const SUBDOMAIN_OVERRIDES: Array<{ pattern: RegExp; provider: ProviderDef }> = [
  {
    pattern: /(^|\.)g\.alchemy\.com$/i,
    provider: APEX_PROVIDERS['alchemy.com'],
  },
];

export type ResolvedProvider = {
  id: string;
  name: string;
  kind: ProviderDef['kind'] | 'unknown';
  verified: boolean;
};

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function extractApex(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join('.');
}

export function identifyProvider(url: string): ResolvedProvider {
  const hostname = extractHostname(url);
  if (!hostname) {
    return { id: `unknown:${url}`, name: url, kind: 'unknown', verified: false };
  }

  for (const override of SUBDOMAIN_OVERRIDES) {
    if (override.pattern.test(hostname)) {
      return { ...override.provider, kind: override.provider.kind, verified: true };
    }
  }

  const apex = extractApex(hostname);
  const direct = APEX_PROVIDERS[apex];
  if (direct) {
    return { id: direct.id, name: direct.name, kind: direct.kind, verified: true };
  }

  return {
    id: `host:${apex}`,
    name: apex,
    kind: 'unknown',
    verified: false,
  };
}

/**
 * Given a list of RPC URLs, return how many distinct providers they
 * actually represent. Two URLs mapped to the same provider id count as
 * one. Two URLs on different unrecognised apexes count as two.
 */
export function countDistinctProviders(urls: string[]): number {
  const ids = new Set<string>();
  for (const url of urls) {
    ids.add(identifyProvider(url).id);
  }
  return ids.size;
}

/**
 * Group URLs by resolved provider, preserving insertion order of first
 * occurrence per provider.
 */
export function groupByProvider(urls: string[]): Array<{ provider: ResolvedProvider; urls: string[] }> {
  const byId = new Map<string, { provider: ResolvedProvider; urls: string[] }>();
  for (const url of urls) {
    const provider = identifyProvider(url);
    const existing = byId.get(provider.id);
    if (existing) {
      existing.urls.push(url);
    } else {
      byId.set(provider.id, { provider, urls: [url] });
    }
  }
  return Array.from(byId.values());
}
