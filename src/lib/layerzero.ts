/**
 * LayerZero V2 endpoint metadata.
 *
 * Official snapshot: https://metadata.layerzero-api.com/v1/metadata
 * Each mainnet entry lists the native chainId, ACTIVE/DEPRECATED status,
 * and the RPC URLs LayerZero itself uses. We treat those RPCs as a fourth
 * source (alongside chainlist, ethereum-lists, and our own probes) and
 * tag every matching chain so the dashboard can isolate "familiar
 * LayerZero networks with only one public RPC".
 */

import type { FetchWithNextCacheInit } from './chains';
import { CHAIN_DATA_CACHE_SECONDS } from './chains';

export const LAYERZERO_METADATA_URL = 'https://metadata.layerzero-api.com/v1/metadata';

export type LayerZeroStatus = 'ACTIVE' | 'DEPRECATED' | 'PRIVATE' | 'UNKNOWN';

export type LayerZeroChainInfo = {
  chainKey: string;
  name: string;
  chainId: number | null;
  chainType: string;
  status: LayerZeroStatus;
  eid: number | null;
  rpcs: string[];
};

export type LayerZeroIndex = {
  byChainId: Map<number, LayerZeroChainInfo>;
  byNonEvmKey: Map<string, LayerZeroChainInfo>;
  mainnetCount: number;
  activeCount: number;
  rpcCount: number;
};

type RawLzChain = {
  chainKey?: string;
  chainName?: string;
  environment?: string;
  rpcs?: Array<{ url?: string } | null> | null;
  deployments?: Array<{ eid?: number | string; endpointV2?: string } | null> | null;
  chainDetails?: {
    nativeChainId?: number | string;
    chainKey?: string;
    chainType?: string;
    chainStatus?: string;
  } | null;
};

const NONEVM_KEYS = new Set(['solana', 'aptos', 'sui', 'ton', 'tron', 'near']);

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeStatus(value: string | undefined): LayerZeroStatus {
  const upper = (value ?? '').toUpperCase();
  if (upper === 'ACTIVE' || upper === 'DEPRECATED' || upper === 'PRIVATE') return upper;
  return 'UNKNOWN';
}

function extractRpcs(raw: RawLzChain['rpcs']): string[] {
  if (!Array.isArray(raw)) return [];
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    const url = typeof entry?.url === 'string' ? entry.url.trim() : '';
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function extractEid(deployments: RawLzChain['deployments']): number | null {
  if (!Array.isArray(deployments)) return null;
  for (const deployment of deployments) {
    const eid = toNumber(deployment?.eid);
    if (eid !== null && eid >= 30_000 && eid < 40_000) return eid;
  }
  for (const deployment of deployments) {
    const eid = toNumber(deployment?.eid);
    if (eid !== null) return eid;
  }
  return null;
}

export function buildLayerZeroIndex(payload: unknown): LayerZeroIndex {
  const byChainId = new Map<number, LayerZeroChainInfo>();
  const byNonEvmKey = new Map<string, LayerZeroChainInfo>();
  let mainnetCount = 0;
  let activeCount = 0;
  let rpcCount = 0;

  if (!payload || typeof payload !== 'object') {
    return { byChainId, byNonEvmKey, mainnetCount, activeCount, rpcCount };
  }

  for (const [key, rawValue] of Object.entries(payload as Record<string, RawLzChain>)) {
    if (!rawValue || typeof rawValue !== 'object') continue;
    if (rawValue.environment !== 'mainnet') continue;
    if (key.includes('testnet') || key.includes('sandbox')) continue;

    const details = rawValue.chainDetails ?? {};
    const chainType = (details.chainType ?? '').toLowerCase();
    const info: LayerZeroChainInfo = {
      chainKey: rawValue.chainKey ?? details.chainKey ?? key,
      name: rawValue.chainName ?? key,
      chainId: toNumber(details.nativeChainId),
      chainType,
      status: normalizeStatus(details.chainStatus),
      eid: extractEid(rawValue.deployments),
      rpcs: extractRpcs(rawValue.rpcs),
    };

    mainnetCount += 1;
    if (info.status === 'ACTIVE') activeCount += 1;
    rpcCount += info.rpcs.length;

    if (info.chainId !== null && info.chainId > 0 && (chainType === 'evm' || chainType === '')) {
      const existing = byChainId.get(info.chainId);
      if (!existing || (existing.status !== 'ACTIVE' && info.status === 'ACTIVE')) {
        byChainId.set(info.chainId, info);
      } else if (existing) {
        const urls = new Set([...existing.rpcs, ...info.rpcs]);
        existing.rpcs = Array.from(urls);
      }
    }

    if (NONEVM_KEYS.has(info.chainKey)) {
      byNonEvmKey.set(info.chainKey, info);
    }
  }

  return { byChainId, byNonEvmKey, mainnetCount, activeCount, rpcCount };
}

export async function fetchLayerZeroIndex(
  init: FetchWithNextCacheInit = { next: { revalidate: CHAIN_DATA_CACHE_SECONDS } },
): Promise<LayerZeroIndex> {
  const response = await fetch(LAYERZERO_METADATA_URL, {
    headers: { accept: 'application/json' },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch LayerZero metadata: ${response.status} ${response.statusText}`);
  }
  return buildLayerZeroIndex(await response.json());
}

export function layerZeroForEvm(index: LayerZeroIndex | undefined, chainId: number): LayerZeroChainInfo | null {
  return index?.byChainId.get(chainId) ?? null;
}

export function layerZeroForNonEvm(
  index: LayerZeroIndex | undefined,
  shortName: string,
): LayerZeroChainInfo | null {
  return index?.byNonEvmKey.get(shortName.toLowerCase()) ?? null;
}
