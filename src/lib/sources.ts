/**
 * Dual-source chain registry fetcher.
 *
 * Merges:
 *   - chainlist.org/rpcs.json        (primary: richer, has per-RPC privacy metadata)
 *   - chainid.network/chains.json    (secondary: catches chains chainlist.org doesn't track)
 *
 * Each source contributes chain-level fields and RPC entries; for chains
 * present in both, we union the RPC URLs and retain any tracking /
 * open-source metadata chainlist.org provides.
 */

import type { FetchWithNextCacheInit } from './chains';
import { CHAIN_DATA_CACHE_SECONDS, CHAIN_DATA_URL } from './chains';

export const CHAINLIST_RPCS_URL = 'https://chainlist.org/rpcs.json';

export type MergedRpcInput = {
  url: string;
  tracking?: string | null;
  isOpenSource?: boolean | null;
  sources: ('chainlist.org' | 'ethereum-lists')[];
};

export type MergedRawChain = {
  chainId: number;
  name: string;
  shortName: string;
  chain: string;
  rpc: MergedRpcInput[];
  nativeCurrency?: { name?: string; symbol?: string; decimals?: number } | null;
  explorers?: Array<{ name?: string; url?: string; standard?: string; icon?: string } | null> | null;
  infoURL?: string | null;
  isTestnetHint?: boolean;
  tvl?: number | null;
  sources: ('chainlist.org' | 'ethereum-lists')[];
};

type RawEthereumListsChain = {
  chainId?: number | string;
  name?: string;
  shortName?: string;
  chain?: string;
  rpc?: unknown;
  nativeCurrency?: { name?: string; symbol?: string; decimals?: number };
  explorers?: Array<{ name?: string; url?: string; standard?: string; icon?: string }>;
  infoURL?: string;
};

type RawChainlistRpcEntry =
  | string
  | { url?: string; tracking?: string; isOpenSource?: boolean };

type RawChainlistChain = {
  chainId?: number | string;
  name?: string;
  shortName?: string;
  chain?: string;
  rpc?: RawChainlistRpcEntry[];
  nativeCurrency?: { name?: string; symbol?: string; decimals?: number };
  explorers?: Array<{ name?: string; url?: string; standard?: string; icon?: string }>;
  infoURL?: string;
  isTestnet?: boolean;
  tvl?: number | string | null;
};

function toNumberChainId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeUrl(raw: string): string {
  return raw.trim();
}

async function fetchJson<T>(url: string, init?: FetchWithNextCacheInit): Promise<T> {
  // Both source responses are larger than Next's 2MB fetch cache limit, so
  // it prints a warning that it couldn't persist the response. That is
  // harmless — we keep our own in-memory cache in chains.server.ts.
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  return payload as T;
}

function ingestEthereumLists(chains: RawEthereumListsChain[], map: Map<number, MergedRawChain>) {
  for (const raw of chains) {
    const chainId = toNumberChainId(raw.chainId);
    if (chainId === null) continue;

    const existing = map.get(chainId);
    const rpcEntries = Array.isArray(raw.rpc)
      ? raw.rpc.filter((r): r is string => typeof r === 'string' && r.trim().length > 0).map(normalizeUrl)
      : [];

    if (!existing) {
      map.set(chainId, {
        chainId,
        name: raw.name ?? `Chain ${chainId}`,
        shortName: raw.shortName ?? '',
        chain: raw.chain ?? raw.name ?? '',
        rpc: rpcEntries.map((url) => ({
          url,
          sources: ['ethereum-lists'],
        })),
        nativeCurrency: raw.nativeCurrency ?? null,
        explorers: raw.explorers ?? null,
        infoURL: raw.infoURL ?? null,
        sources: ['ethereum-lists'],
      });
      continue;
    }

    existing.sources = Array.from(new Set([...existing.sources, 'ethereum-lists'])) as MergedRawChain['sources'];
    existing.explorers = existing.explorers ?? raw.explorers ?? null;
    existing.nativeCurrency = existing.nativeCurrency ?? raw.nativeCurrency ?? null;
    existing.infoURL = existing.infoURL ?? raw.infoURL ?? null;
    if (!existing.shortName && raw.shortName) existing.shortName = raw.shortName;
    if (!existing.chain && raw.chain) existing.chain = raw.chain;

    const byUrl = new Map(existing.rpc.map((entry) => [entry.url, entry]));
    for (const url of rpcEntries) {
      const entry = byUrl.get(url);
      if (entry) {
        entry.sources = Array.from(new Set([...entry.sources, 'ethereum-lists'])) as MergedRpcInput['sources'];
      } else {
        existing.rpc.push({ url, sources: ['ethereum-lists'] });
      }
    }
  }
}

function extractTvl(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function ingestChainlist(chains: RawChainlistChain[], map: Map<number, MergedRawChain>) {
  for (const raw of chains) {
    const chainId = toNumberChainId(raw.chainId);
    if (chainId === null) continue;

    const normalizedRpcs: MergedRpcInput[] = (Array.isArray(raw.rpc) ? raw.rpc : [])
      .map<MergedRpcInput | null>((entry) => {
        if (typeof entry === 'string') {
          const url = entry.trim();
          if (!url) return null;
          return { url, sources: ['chainlist.org'] };
        }
        if (entry && typeof entry === 'object' && typeof entry.url === 'string' && entry.url.trim()) {
          return {
            url: entry.url.trim(),
            tracking: typeof entry.tracking === 'string' ? entry.tracking : null,
            isOpenSource: typeof entry.isOpenSource === 'boolean' ? entry.isOpenSource : null,
            sources: ['chainlist.org'],
          };
        }
        return null;
      })
      .filter((entry): entry is MergedRpcInput => entry !== null);

    const tvl = extractTvl(raw.tvl);

    const existing = map.get(chainId);
    if (!existing) {
      map.set(chainId, {
        chainId,
        name: raw.name ?? `Chain ${chainId}`,
        shortName: raw.shortName ?? '',
        chain: raw.chain ?? raw.name ?? '',
        rpc: normalizedRpcs,
        nativeCurrency: raw.nativeCurrency ?? null,
        explorers: raw.explorers ?? null,
        infoURL: raw.infoURL ?? null,
        isTestnetHint: typeof raw.isTestnet === 'boolean' ? raw.isTestnet : undefined,
        tvl,
        sources: ['chainlist.org'],
      });
      continue;
    }

    existing.sources = Array.from(new Set([...existing.sources, 'chainlist.org'])) as MergedRawChain['sources'];
    existing.nativeCurrency = raw.nativeCurrency ?? existing.nativeCurrency ?? null;
    existing.explorers = raw.explorers ?? existing.explorers ?? null;
    existing.infoURL = raw.infoURL ?? existing.infoURL ?? null;
    if (raw.shortName) existing.shortName = raw.shortName;
    if (raw.chain) existing.chain = raw.chain;
    if (raw.name) existing.name = raw.name;
    if (typeof raw.isTestnet === 'boolean') existing.isTestnetHint = raw.isTestnet;
    if (tvl !== null) existing.tvl = tvl;

    const byUrl = new Map(existing.rpc.map((entry) => [entry.url, entry]));
    for (const incoming of normalizedRpcs) {
      const current = byUrl.get(incoming.url);
      if (current) {
        current.sources = Array.from(
          new Set<MergedRpcInput['sources'][number]>([...current.sources, 'chainlist.org']),
        ) as MergedRpcInput['sources'];
        if (current.tracking == null && incoming.tracking != null) current.tracking = incoming.tracking;
        if (current.isOpenSource == null && incoming.isOpenSource != null) {
          current.isOpenSource = incoming.isOpenSource;
        }
      } else {
        existing.rpc.push(incoming);
        byUrl.set(incoming.url, incoming);
      }
    }
  }
}

export type SourceFetchSummary = {
  chainlistCount: number;
  ethereumListsCount: number;
  mergedCount: number;
  onlyInChainlist: number;
  onlyInEthereumLists: number;
  inBoth: number;
  totalRpcEntries: number;
  mergedAt: string;
};

export async function fetchMergedRawChains(
  init: FetchWithNextCacheInit = { next: { revalidate: CHAIN_DATA_CACHE_SECONDS } },
): Promise<{ chains: MergedRawChain[]; summary: SourceFetchSummary }> {
  const [chainlistResult, ethereumListsResult] = await Promise.allSettled([
    fetchJson<RawChainlistChain[]>(CHAINLIST_RPCS_URL, init),
    fetchJson<RawEthereumListsChain[]>(CHAIN_DATA_URL, init),
  ]);

  const chainlist =
    chainlistResult.status === 'fulfilled' && Array.isArray(chainlistResult.value)
      ? chainlistResult.value
      : [];
  const ethereumLists =
    ethereumListsResult.status === 'fulfilled' && Array.isArray(ethereumListsResult.value)
      ? ethereumListsResult.value
      : [];

  if (chainlistResult.status === 'rejected' && ethereumListsResult.status === 'rejected') {
    const clErr = chainlistResult.reason instanceof Error ? chainlistResult.reason.message : 'unknown';
    const elErr =
      ethereumListsResult.reason instanceof Error ? ethereumListsResult.reason.message : 'unknown';
    throw new Error(`Both chain sources failed. chainlist.org: ${clErr}. ethereum-lists: ${elErr}.`);
  }

  const byId = new Map<number, MergedRawChain>();
  // Ingest chainlist.org FIRST so its richer metadata (tracking, isOpenSource, isTestnet) wins.
  ingestChainlist(chainlist, byId);
  ingestEthereumLists(ethereumLists, byId);

  const chains = Array.from(byId.values());
  const chainlistIds = new Set(chainlist.map((c) => toNumberChainId(c.chainId)).filter((id): id is number => id !== null));
  const ethereumListsIds = new Set(
    ethereumLists.map((c) => toNumberChainId(c.chainId)).filter((id): id is number => id !== null),
  );

  let onlyInChainlist = 0;
  let onlyInEthereumLists = 0;
  let inBoth = 0;
  for (const chain of chains) {
    const inCl = chainlistIds.has(chain.chainId);
    const inEl = ethereumListsIds.has(chain.chainId);
    if (inCl && inEl) inBoth += 1;
    else if (inCl) onlyInChainlist += 1;
    else if (inEl) onlyInEthereumLists += 1;
  }

  const totalRpcEntries = chains.reduce((sum, chain) => sum + chain.rpc.length, 0);

  return {
    chains,
    summary: {
      chainlistCount: chainlist.length,
      ethereumListsCount: ethereumLists.length,
      mergedCount: chains.length,
      onlyInChainlist,
      onlyInEthereumLists,
      inBoth,
      totalRpcEntries,
      mergedAt: new Date().toISOString(),
    },
  };
}
