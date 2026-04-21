import { fetchDefiLlamaChains, resolveDefiLlamaTvl, type DefiLlamaIndex } from './defillama';
import { keyGatedProvidersFor, type KeyGatedProvider } from './keyGatedProviders';
import { NON_EVM_SEED } from './nonEvmChains';
import { isNotableChain } from './notableChains';
import { groupByProvider, identifyProvider, type ResolvedProvider } from './providers';
import { fetchMergedRawChains } from './sources';

export type Explorer = {
  name?: string;
  url: string;
  standard?: string;
  icon?: string;
};

export type NativeCurrency = {
  name: string;
  symbol: string;
  decimals: number;
};

export type RiskLevel = 'critical' | 'at-risk' | 'safe' | 'no-data';

export type ChainSource = 'chainlist.org' | 'ethereum-lists';
export type RpcTracking = 'none' | 'limited' | 'yes' | 'unspecified' | 'unknown';
export type RpcKind = 'http' | 'wss' | 'other';

export type ChainArch = 'evm' | 'solana' | 'move' | 'substrate' | 'cosmos' | 'tron' | 'ton' | 'stacks' | 'bitcoin' | 'other';

export type RpcEndpoint = {
  url: string;
  kind: RpcKind;
  isTemplate: boolean;
  tracking: RpcTracking;
  isOpenSource: boolean | null;
  sources: ChainSource[];
  providerId: string;
  providerName: string;
  providerVerified: boolean;
};

export type ProviderGroup = {
  id: string;
  name: string;
  verified: boolean;
  urls: string[];
};

export type ProcessedChain = {
  chainId: number;
  name: string;
  shortName: string;
  chain: string;
  arch: ChainArch;
  caip2: string | null;
  nativeCurrency: NativeCurrency;
  rpc: string[];
  publicRpcs: string[];
  templateRpcs: string[];
  wssRpcs: string[];
  httpRpcs: string[];
  rpcDetails: RpcEndpoint[];
  publicRpcDetails: RpcEndpoint[];
  publicRpcCount: number;
  providerGroups: ProviderGroup[];
  /** Anonymous-access providers only — the free/public operators. */
  anonymousProviders: number;
  /** Total distinct providers = anonymous + paid. Drives risk tier. */
  distinctProviders: number;
  riskLevel: RiskLevel;
  riskScore: number;
  explorers: Explorer[];
  infoURL: string;
  isTestnet: boolean;
  isDeprecated: boolean;
  isNotable: boolean;
  isNonEvm: boolean;
  tvlUsd: number | null;
  tvlSource: 'defillama' | 'chainlist' | null;
  keyGatedProviders: KeyGatedProvider[];
  sources: Array<ChainSource | 'non-evm-seed'>;
  lastChecked: string;
};

export const SIGNIFICANT_TVL_USD = 1_000_000;

type RawNativeCurrency = Partial<NativeCurrency> | null | undefined;

type RawExplorer = Partial<Explorer> | null | undefined;

type RawChain = {
  chainId?: number | string | null;
  name?: string | null;
  shortName?: string | null;
  chain?: string | null;
  nativeCurrency?: RawNativeCurrency;
  rpc?: unknown;
  explorers?: RawExplorer[] | null;
  infoURL?: string | null;
};

type SearchResult = {
  chain: ProcessedChain;
  score: number;
};

export type FetchWithNextCacheInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export const CHAIN_DATA_URL = 'https://chainid.network/chains.json';
export const CHAIN_DATA_CACHE_SECONDS = 60 * 60;
export const HEALTH_CACHE_SECONDS = 60;
export const RPC_TIMEOUT_MS = 5_000;
export const SLOW_RPC_THRESHOLD_MS = 2_000;

const DEPRECATED_CHAIN_IDS = new Set([3, 4, 5, 42]);
const TESTNET_PATTERNS = [
  /testnet/i,
  /\btest\b/i,
  /sepolia/i,
  /goerli/i,
  /rinkeby/i,
  /ropsten/i,
  /mumbai/i,
  /fuji/i,
  /chapel/i,
  /holesky/i,
];
const TEMPLATE_RPC_PATTERN = /\$\{[^}]+\}/;
const HTTP_RPC_PATTERN = /^https?:\/\//i;
const WS_RPC_PATTERN = /^wss?:\/\//i;

function normalizeString(value: string | null | undefined, fallback = ''): string {
  return typeof value === 'string' ? value.trim() || fallback : fallback;
}

function normalizeChainId(chainId: number | string | null | undefined): number | null {
  if (typeof chainId === 'number' && Number.isFinite(chainId)) {
    return chainId;
  }

  if (typeof chainId === 'string' && chainId.trim().length > 0) {
    const parsed = Number.parseInt(chainId, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeNativeCurrency(nativeCurrency: RawNativeCurrency): NativeCurrency {
  return {
    name: normalizeString(nativeCurrency?.name, 'Unknown'),
    symbol: normalizeString(nativeCurrency?.symbol, 'UNKNOWN'),
    decimals:
      typeof nativeCurrency?.decimals === 'number' && Number.isFinite(nativeCurrency.decimals)
        ? nativeCurrency.decimals
        : 18,
  };
}

function normalizeRpcList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((rpc): rpc is string => typeof rpc === 'string')
    .map((rpc) => rpc.trim())
    .filter(Boolean);
}

function normalizeExplorers(explorers: RawExplorer[] | null | undefined): Explorer[] {
  if (!Array.isArray(explorers)) {
    return [];
  }

  return explorers
    .map<Explorer | null>((explorer) => {
      const url = normalizeString(explorer?.url);

      if (!url) {
        return null;
      }

      return {
        url,
        name: normalizeString(explorer?.name) || undefined,
        standard: normalizeString(explorer?.standard) || undefined,
        icon: normalizeString(explorer?.icon) || undefined,
      };
    })
    .filter((explorer): explorer is Explorer => explorer !== null);
}

export function isTemplateRpc(rpcUrl: string): boolean {
  return TEMPLATE_RPC_PATTERN.test(rpcUrl);
}

export function isHttpRpc(rpcUrl: string): boolean {
  return HTTP_RPC_PATTERN.test(rpcUrl);
}

export function isWebsocketRpc(rpcUrl: string): boolean {
  return WS_RPC_PATTERN.test(rpcUrl);
}

export function isTestnetName(name: string): boolean {
  return TESTNET_PATTERNS.some((pattern) => pattern.test(name));
}

export function isDeprecatedChain(name: string, chainId: number): boolean {
  return /deprecated/i.test(name) || DEPRECATED_CHAIN_IDS.has(chainId);
}

export function calculateRiskScore(distinctProviders: number): number {
  if (distinctProviders <= 0) {
    return 100;
  }

  if (distinctProviders === 1) {
    return 95;
  }

  if (distinctProviders === 2) {
    return 70;
  }

  if (distinctProviders === 3) {
    return 40;
  }

  if (distinctProviders === 4) {
    return 20;
  }

  return 5;
}

export function calculateRiskLevel(distinctProviders: number): RiskLevel {
  if (distinctProviders <= 0) {
    return 'no-data';
  }

  if (distinctProviders === 1) {
    return 'critical';
  }

  if (distinctProviders <= 3) {
    return 'at-risk';
  }

  return 'safe';
}

function buildRpcDetailsFromUrls(
  urls: string[],
  sources: ChainSource[],
): RpcEndpoint[] {
  return urls.map<RpcEndpoint>((url) => {
    const provider = identifyProvider(url);
    return {
      url,
      kind: classifyRpcKind(url),
      isTemplate: isTemplateRpc(url),
      tracking: 'unknown',
      isOpenSource: null,
      sources,
      providerId: provider.id,
      providerName: provider.name,
      providerVerified: provider.verified,
    };
  });
}

function providerGroupsFromDetails(details: RpcEndpoint[]): ProviderGroup[] {
  const groups = groupByProvider(details.map((entry) => entry.url));
  return groups.map<ProviderGroup>((group) => ({
    id: group.provider.id,
    name: group.provider.name,
    verified: group.provider.verified,
    urls: group.urls,
  }));
}

export function processChains(rawChains: RawChain[], checkedAt = new Date().toISOString()): ProcessedChain[] {
  return rawChains
    .map<ProcessedChain | null>((rawChain) => {
      const chainId = normalizeChainId(rawChain.chainId);

      if (chainId === null) {
        return null;
      }

      const name = normalizeString(rawChain.name, `Chain ${chainId}`);
      const shortName = normalizeString(rawChain.shortName, name.toLowerCase().replace(/\s+/g, '-'));
      const chain = normalizeString(rawChain.chain, name);
      const rpc = normalizeRpcList(rawChain.rpc);
      const publicRpcs = rpc.filter((rpcUrl) => !isTemplateRpc(rpcUrl));
      const templateRpcs = rpc.filter((rpcUrl) => isTemplateRpc(rpcUrl));
      const wssRpcs = rpc.filter((rpcUrl) => isWebsocketRpc(rpcUrl));
      const httpRpcs = rpc.filter((rpcUrl) => isHttpRpc(rpcUrl));
      const publicRpcCount = publicRpcs.length;
      const rpcDetails = buildRpcDetailsFromUrls(rpc, ['ethereum-lists']);
      const publicRpcDetails = rpcDetails.filter((entry) => !entry.isTemplate);
      const providerGroups = providerGroupsFromDetails(publicRpcDetails);
      const anonymousProviders = providerGroups.length;
      // distinctProviders + riskLevel get finalised after key-gated
      // providers are attached in the .map() below.

      return {
        chainId,
        name,
        shortName,
        chain,
        arch: 'evm',
        caip2: `eip155:${chainId}`,
        nativeCurrency: normalizeNativeCurrency(rawChain.nativeCurrency),
        rpc,
        publicRpcs,
        templateRpcs,
        wssRpcs,
        httpRpcs,
        rpcDetails,
        publicRpcDetails,
        publicRpcCount,
        providerGroups,
        anonymousProviders,
        distinctProviders: anonymousProviders,
        riskLevel: calculateRiskLevel(anonymousProviders),
        riskScore: calculateRiskScore(anonymousProviders),
        explorers: normalizeExplorers(rawChain.explorers),
        infoURL: normalizeString(rawChain.infoURL),
        isTestnet: isTestnetName(name),
        isDeprecated: isDeprecatedChain(name, chainId),
        isNotable: isNotableChain(chainId),
        isNonEvm: false,
        tvlUsd: null,
        tvlSource: null,
        keyGatedProviders: [],
        sources: ['ethereum-lists'],
        lastChecked: checkedAt,
      };
    })
    .filter((chain): chain is ProcessedChain => chain !== null)
    .map((chain) => {
      chain.keyGatedProviders = keyGatedProvidersFor(chain);
      chain.distinctProviders = chain.anonymousProviders + chain.keyGatedProviders.length;
      chain.riskLevel = calculateRiskLevel(chain.distinctProviders);
      chain.riskScore = calculateRiskScore(chain.distinctProviders);
      return chain;
    })
    .sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }

      if (left.distinctProviders !== right.distinctProviders) {
        return left.distinctProviders - right.distinctProviders;
      }

      return left.name.localeCompare(right.name);
    });
}

function classifyRpcKind(url: string): RpcKind {
  if (isHttpRpc(url)) return 'http';
  if (isWebsocketRpc(url)) return 'wss';
  return 'other';
}

function normalizeTracking(value: string | null | undefined): RpcTracking {
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'none' || normalized === 'limited' || normalized === 'yes' || normalized === 'unspecified') {
    return normalized;
  }
  return 'unknown';
}

type MergedRpcLike = {
  url: string;
  tracking?: string | null;
  isOpenSource?: boolean | null;
  sources: ChainSource[];
};

type MergedRawLike = {
  chainId: number;
  name: string;
  shortName: string;
  chain: string;
  rpc: MergedRpcLike[];
  nativeCurrency?: Partial<NativeCurrency> | null;
  explorers?: Array<Partial<Explorer> | null> | null;
  infoURL?: string | null;
  isTestnetHint?: boolean;
  tvl?: number | null;
  sources: ChainSource[];
};

export function processMergedChains(
  merged: MergedRawLike[],
  checkedAt = new Date().toISOString(),
  defillamaIndex?: DefiLlamaIndex,
): ProcessedChain[] {
  return merged
    .map((raw) => {
      const chainId = raw.chainId;
      const name = normalizeString(raw.name, `Chain ${chainId}`);
      const shortName = normalizeString(raw.shortName, name.toLowerCase().replace(/\s+/g, '-'));
      const chainField = normalizeString(raw.chain, name);

      const rpcDetails = raw.rpc.map<RpcEndpoint>((entry) => {
        const provider = identifyProvider(entry.url);
        return {
          url: entry.url,
          kind: classifyRpcKind(entry.url),
          isTemplate: isTemplateRpc(entry.url),
          tracking: normalizeTracking(entry.tracking),
          isOpenSource: typeof entry.isOpenSource === 'boolean' ? entry.isOpenSource : null,
          sources: Array.from(new Set(entry.sources)) as ChainSource[],
          providerId: provider.id,
          providerName: provider.name,
          providerVerified: provider.verified,
        };
      });

      const rpc = rpcDetails.map((entry) => entry.url);
      const publicRpcDetails = rpcDetails.filter((entry) => !entry.isTemplate);
      const publicRpcs = publicRpcDetails.map((entry) => entry.url);
      const templateRpcs = rpcDetails.filter((entry) => entry.isTemplate).map((entry) => entry.url);
      const wssRpcs = rpcDetails.filter((entry) => entry.kind === 'wss').map((entry) => entry.url);
      const httpRpcs = rpcDetails.filter((entry) => entry.kind === 'http').map((entry) => entry.url);
      const publicRpcCount = publicRpcDetails.length;
      const providerGroups = providerGroupsFromDetails(publicRpcDetails);
      const anonymousProviders = providerGroups.length;
      const isTestnet =
        typeof raw.isTestnetHint === 'boolean' ? raw.isTestnetHint : isTestnetName(name);
      // chainlist.org replicates mainnet TVL onto sibling testnet entries, so
      // null it out for testnets to avoid showing a testnet as having $117B TVL.
      const chainlistTvl =
        !isTestnet && typeof raw.tvl === 'number' && Number.isFinite(raw.tvl) && raw.tvl > 0
          ? raw.tvl
          : null;

      // DefiLlama is the upstream source; prefer it when available.
      let tvlUsd: number | null = chainlistTvl;
      let tvlSource: ProcessedChain['tvlSource'] = chainlistTvl !== null ? 'chainlist' : null;
      if (!isTestnet && defillamaIndex) {
        const { tvl } = resolveDefiLlamaTvl(defillamaIndex, chainId, name);
        if (tvl !== null && tvl > 0) {
          tvlUsd = tvl;
          tvlSource = 'defillama';
        }
      }

      return {
        chainId,
        name,
        shortName,
        chain: chainField,
        arch: 'evm',
        caip2: `eip155:${chainId}`,
        nativeCurrency: normalizeNativeCurrency(raw.nativeCurrency ?? null),
        rpc,
        publicRpcs,
        templateRpcs,
        wssRpcs,
        httpRpcs,
        rpcDetails,
        publicRpcDetails,
        publicRpcCount,
        providerGroups,
        anonymousProviders,
        distinctProviders: anonymousProviders,
        riskLevel: calculateRiskLevel(anonymousProviders),
        riskScore: calculateRiskScore(anonymousProviders),
        explorers: normalizeExplorers(raw.explorers ?? null),
        infoURL: normalizeString(raw.infoURL ?? null),
        isTestnet,
        isDeprecated: isDeprecatedChain(name, chainId),
        isNotable: isNotableChain(chainId),
        isNonEvm: false,
        tvlUsd,
        tvlSource,
        keyGatedProviders: [],
        sources: Array.from(new Set(raw.sources)) as ChainSource[],
        lastChecked: checkedAt,
      } as ProcessedChain;
    })
    .map((chain) => {
      chain.keyGatedProviders = keyGatedProvidersFor(chain);
      chain.distinctProviders = chain.anonymousProviders + chain.keyGatedProviders.length;
      chain.riskLevel = calculateRiskLevel(chain.distinctProviders);
      chain.riskScore = calculateRiskScore(chain.distinctProviders);
      return chain;
    })
    .sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }
      if (left.distinctProviders !== right.distinctProviders) {
        return left.distinctProviders - right.distinctProviders;
      }
      return left.name.localeCompare(right.name);
    });
}

/**
 * Turn the non-EVM seed table entries into ProcessedChain records and
 * join TVL from DefiLlama.
 */
export function processNonEvmSeeds(
  checkedAt = new Date().toISOString(),
  defillamaIndex?: DefiLlamaIndex,
): ProcessedChain[] {
  return NON_EVM_SEED.map<ProcessedChain>((seed) => {
    const rpcDetails: RpcEndpoint[] = seed.rpcs.map((entry) => {
      const fromMap = identifyProvider(entry.url);
      // Seed operators are authoritative: if the map returns unknown but
      // we have a declared operator, use that as the provider identity.
      const provider: ResolvedProvider = fromMap.verified
        ? fromMap
        : {
            id: `seed:${entry.operator.toLowerCase()}`,
            name: entry.operator,
            kind: 'foundation',
            verified: true,
          };
      return {
        url: entry.url,
        kind: classifyRpcKind(entry.url),
        isTemplate: isTemplateRpc(entry.url),
        tracking: entry.tracking ?? 'unspecified',
        isOpenSource: typeof entry.isOpenSource === 'boolean' ? entry.isOpenSource : null,
        sources: [],
        providerId: provider.id,
        providerName: provider.name,
        providerVerified: provider.verified,
      };
    });

    const publicRpcDetails = rpcDetails.filter((entry) => !entry.isTemplate);
    const publicRpcs = publicRpcDetails.map((entry) => entry.url);
    const urls = rpcDetails.map((entry) => entry.url);
    const providerGroupsRaw = new Map<string, ProviderGroup>();
    for (const detail of publicRpcDetails) {
      const existing = providerGroupsRaw.get(detail.providerId);
      if (existing) existing.urls.push(detail.url);
      else
        providerGroupsRaw.set(detail.providerId, {
          id: detail.providerId,
          name: detail.providerName,
          verified: detail.providerVerified,
          urls: [detail.url],
        });
    }
    const providerGroups = Array.from(providerGroupsRaw.values());
    const anonymousProviders = providerGroups.length;

    let tvlUsd: number | null = null;
    let tvlSource: ProcessedChain['tvlSource'] = null;
    if (defillamaIndex) {
      const resolved = resolveDefiLlamaTvl(defillamaIndex, seed.chainId, seed.defillamaName);
      if (resolved.tvl !== null && resolved.tvl > 0) {
        tvlUsd = resolved.tvl;
        tvlSource = 'defillama';
      }
    }

    return {
      chainId: seed.chainId,
      name: seed.name,
      shortName: seed.shortName,
      chain: seed.name,
      arch: seed.arch,
      caip2: seed.caip2,
      nativeCurrency: seed.nativeCurrency,
      rpc: urls,
      publicRpcs,
      templateRpcs: [],
      wssRpcs: rpcDetails.filter((entry) => entry.kind === 'wss').map((entry) => entry.url),
      httpRpcs: rpcDetails.filter((entry) => entry.kind === 'http').map((entry) => entry.url),
      rpcDetails,
      publicRpcDetails,
      publicRpcCount: publicRpcDetails.length,
      providerGroups,
      anonymousProviders,
      distinctProviders: anonymousProviders,
      riskLevel: calculateRiskLevel(anonymousProviders),
      riskScore: calculateRiskScore(anonymousProviders),
      explorers: [],
      infoURL: seed.infoURL,
      isTestnet: false,
      isDeprecated: false,
      isNotable: true,
      isNonEvm: true,
      tvlUsd,
      tvlSource,
      keyGatedProviders: [],
      sources: ['non-evm-seed'],
      lastChecked: checkedAt,
    };
  }).map((chain) => {
    chain.keyGatedProviders = keyGatedProvidersFor(chain);
    chain.distinctProviders = chain.anonymousProviders + chain.keyGatedProviders.length;
    chain.riskLevel = calculateRiskLevel(chain.distinctProviders);
    chain.riskScore = calculateRiskScore(chain.distinctProviders);
    return chain;
  });
}

export async function fetchRawChains(init?: FetchWithNextCacheInit): Promise<RawChain[]> {
  const response = await fetch(CHAIN_DATA_URL, {
    headers: {
      accept: 'application/json',
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chains: ${response.status} ${response.statusText}`);
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error('Expected chains.json to return an array.');
  }

  return payload as RawChain[];
}

export async function getProcessedChains(init?: FetchWithNextCacheInit): Promise<ProcessedChain[]> {
  const { chains } = await getProcessedChainBundle(init);
  return chains;
}

export async function getProcessedChainBundle(init?: FetchWithNextCacheInit) {
  const [mergedResult, defillamaResult] = await Promise.allSettled([
    fetchMergedRawChains(init),
    fetchDefiLlamaChains(),
  ]);

  if (mergedResult.status === 'rejected') {
    throw mergedResult.reason instanceof Error
      ? mergedResult.reason
      : new Error('Failed to fetch chain registries.');
  }

  const { chains: rawChains, summary } = mergedResult.value;
  const defillamaIndex =
    defillamaResult.status === 'fulfilled' ? defillamaResult.value : undefined;

  const evmChains = processMergedChains(rawChains, undefined, defillamaIndex);
  const nonEvmChains = processNonEvmSeeds(undefined, defillamaIndex);

  // Non-EVM seed entries always go at the top of their risk tier because
  // they are hand-curated and authoritative.
  const chains = [...nonEvmChains, ...evmChains];

  const enrichedSummary = {
    ...summary,
    defillamaAvailable: defillamaResult.status === 'fulfilled',
    defillamaChainCount: defillamaResult.status === 'fulfilled' ? defillamaResult.value.byChainId.size : 0,
    nonEvmSeedCount: nonEvmChains.length,
  };

  return { chains, summary: enrichedSummary };
}

export function getChainById(chains: ProcessedChain[], chainId: number): ProcessedChain | undefined {
  return chains.find((chain) => chain.chainId === chainId);
}

function normalizeSearchValue(value: string): string {
  return value.trim().toLowerCase();
}

function fuzzySubsequenceScore(query: string, candidate: string): number {
  if (!query || !candidate) {
    return 0;
  }

  let queryIndex = 0;
  let score = 0;
  let streak = 0;

  for (let candidateIndex = 0; candidateIndex < candidate.length; candidateIndex += 1) {
    if (candidate[candidateIndex] === query[queryIndex]) {
      streak += 1;
      score += 4 + streak * 2;
      queryIndex += 1;

      if (queryIndex === query.length) {
        return score;
      }
    } else {
      streak = 0;
    }
  }

  return 0;
}

function scoreChainMatch(chain: ProcessedChain, query: string): number {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return 0;
  }

  const normalizedName = normalizeSearchValue(chain.name);
  const normalizedShortName = normalizeSearchValue(chain.shortName);
  const normalizedChain = normalizeSearchValue(chain.chain);

  let score = 0;

  if (/^\d+$/.test(normalizedQuery) && chain.chainId === Number.parseInt(normalizedQuery, 10)) {
    score = Math.max(score, 1_000);
  }

  if (normalizedName === normalizedQuery) {
    score = Math.max(score, 960);
  }

  if (normalizedShortName === normalizedQuery) {
    score = Math.max(score, 940);
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    score = Math.max(score, 900);
  }

  if (normalizedShortName.startsWith(normalizedQuery)) {
    score = Math.max(score, 880);
  }

  if (normalizedChain.startsWith(normalizedQuery)) {
    score = Math.max(score, 860);
  }

  if (normalizedName.includes(normalizedQuery)) {
    score = Math.max(score, 820);
  }

  if (normalizedShortName.includes(normalizedQuery)) {
    score = Math.max(score, 780);
  }

  if (normalizedChain.includes(normalizedQuery)) {
    score = Math.max(score, 740);
  }

  if (chain.rpc.some((rpcUrl) => normalizeSearchValue(rpcUrl).includes(normalizedQuery))) {
    score = Math.max(score, 700);
  }

  const nameFuzzyScore = fuzzySubsequenceScore(normalizedQuery, normalizedName);
  const shortNameFuzzyScore = fuzzySubsequenceScore(normalizedQuery, normalizedShortName);
  const chainFuzzyScore = fuzzySubsequenceScore(normalizedQuery, normalizedChain);

  if (nameFuzzyScore > 0) {
    score = Math.max(score, 520 + nameFuzzyScore);
  }

  if (shortNameFuzzyScore > 0) {
    score = Math.max(score, 500 + shortNameFuzzyScore);
  }

  if (chainFuzzyScore > 0) {
    score = Math.max(score, 480 + chainFuzzyScore);
  }

  return score;
}

export function searchChains(chains: ProcessedChain[], query: string, limit = 20): ProcessedChain[] {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return [];
  }

  return chains
    .map((chain) => {
      const score = scoreChainMatch(chain, normalizedQuery);
      return { chain, score } satisfies SearchResult;
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.chain.riskScore !== left.chain.riskScore) {
        return right.chain.riskScore - left.chain.riskScore;
      }

      return left.chain.name.localeCompare(right.chain.name);
    })
    .slice(0, limit)
    .map((result) => result.chain);
}

export type ChainStats = {
  totalChains: number;
  mainnetChains: number;
  criticalChains: number;
  atRiskChains: number;
  safeChains: number;
  noDataChains: number;
  lastUpdated: string;
  topCritical: ProcessedChain[];
};

export function buildChainStats(chains: ProcessedChain[]): ChainStats {
  const criticalChains = chains.filter((chain) => chain.publicRpcCount === 1);
  const atRiskChains = chains.filter(
    (chain) => chain.publicRpcCount >= 2 && chain.publicRpcCount <= 3,
  );
  const safeChains = chains.filter((chain) => chain.publicRpcCount >= 4);
  const noDataChains = chains.filter((chain) => chain.publicRpcCount === 0);

  return {
    totalChains: chains.length,
    mainnetChains: chains.filter((chain) => !chain.isTestnet).length,
    criticalChains: criticalChains.length,
    atRiskChains: atRiskChains.length,
    safeChains: safeChains.length,
    noDataChains: noDataChains.length,
    lastUpdated: chains[0]?.lastChecked ?? new Date().toISOString(),
    topCritical: criticalChains.slice(0, 10),
  };
}
