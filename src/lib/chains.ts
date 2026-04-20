import { isNotableChain } from './notableChains';

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

export type ProcessedChain = {
  chainId: number;
  name: string;
  shortName: string;
  chain: string;
  nativeCurrency: NativeCurrency;
  rpc: string[];
  publicRpcs: string[];
  templateRpcs: string[];
  wssRpcs: string[];
  httpRpcs: string[];
  publicRpcCount: number;
  riskLevel: RiskLevel;
  riskScore: number;
  explorers: Explorer[];
  infoURL: string;
  isTestnet: boolean;
  isDeprecated: boolean;
  isNotable: boolean;
  lastChecked: string;
};

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

export function calculateRiskScore(publicRpcCount: number): number {
  if (publicRpcCount <= 0) {
    return 100;
  }

  if (publicRpcCount === 1) {
    return 95;
  }

  if (publicRpcCount === 2) {
    return 70;
  }

  if (publicRpcCount === 3) {
    return 40;
  }

  if (publicRpcCount === 4) {
    return 20;
  }

  return 5;
}

export function calculateRiskLevel(publicRpcCount: number): RiskLevel {
  if (publicRpcCount <= 0) {
    return 'no-data';
  }

  if (publicRpcCount === 1) {
    return 'critical';
  }

  if (publicRpcCount <= 3) {
    return 'at-risk';
  }

  return 'safe';
}

export function processChains(rawChains: RawChain[], checkedAt = new Date().toISOString()): ProcessedChain[] {
  return rawChains
    .map((rawChain) => {
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
      const riskScore = calculateRiskScore(publicRpcCount);

      return {
        chainId,
        name,
        shortName,
        chain,
        nativeCurrency: normalizeNativeCurrency(rawChain.nativeCurrency),
        rpc,
        publicRpcs,
        templateRpcs,
        wssRpcs,
        httpRpcs,
        publicRpcCount,
        riskLevel: calculateRiskLevel(publicRpcCount),
        riskScore,
        explorers: normalizeExplorers(rawChain.explorers),
        infoURL: normalizeString(rawChain.infoURL),
        isTestnet: isTestnetName(name),
        isDeprecated: isDeprecatedChain(name, chainId),
        isNotable: isNotableChain(chainId),
        lastChecked: checkedAt,
      } satisfies ProcessedChain;
    })
    .filter((chain): chain is ProcessedChain => chain !== null)
    .sort((left, right) => {
      if (right.riskScore !== left.riskScore) {
        return right.riskScore - left.riskScore;
      }

      if (left.publicRpcCount !== right.publicRpcCount) {
        return left.publicRpcCount - right.publicRpcCount;
      }

      return left.name.localeCompare(right.name);
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
  const rawChains = await fetchRawChains(init);
  return processChains(rawChains);
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
