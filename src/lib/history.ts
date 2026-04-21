/**
 * Snapshot history reader.
 *
 * Reads every JSON file in data/snapshots/, sorts by capture date, and
 * exposes helpers for computing tier changes between consecutive
 * snapshots. A GitHub Action writes one snapshot per day; this module
 * is how the rendered site sees that history.
 *
 * Designed to run at build time on the server. All IO is sync-free
 * because Next.js server components prefer async.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export type HistoricalChain = {
  chainId: number;
  name: string;
  shortName: string;
  arch: string;
  isNonEvm: boolean;
  isTestnet: boolean;
  isDeprecated: boolean;
  distinctProviders: number;
  publicRpcCount: number;
  riskLevel: string;
  tvlUsd: number | null;
  providerIds: string[];
};

export type Snapshot = {
  version: number;
  capturedAt: string;
  captureDate: string;
  summary: {
    totalChains: number;
    critical: number;
    atRisk: number;
    safe: number;
    noData: number;
  };
  chains: HistoricalChain[];
};

export type TierChange = {
  chainId: number;
  name: string;
  fromDate: string;
  toDate: string;
  fromRiskLevel: string;
  toRiskLevel: string;
  fromDistinctProviders: number;
  toDistinctProviders: number;
  direction: 'worse' | 'better';
  tvlUsd: number | null;
};

const RISK_ORDER: Record<string, number> = {
  'no-data': 4,
  critical: 3,
  'at-risk': 2,
  safe: 1,
};

/**
 * How many of the most-recent snapshots to actually deserialise. Files
 * older than this are ignored at runtime; they stay on disk for audit.
 */
const MAX_SNAPSHOTS_LOADED = 60;

export async function loadSnapshots(snapshotDir?: string): Promise<Snapshot[]> {
  const dir = snapshotDir ?? path.join(process.cwd(), 'data', 'snapshots');
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const files = entries
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort()
    .slice(-MAX_SNAPSHOTS_LOADED);

  const snapshots: Snapshot[] = [];
  for (const file of files) {
    const contents = await readFile(path.join(dir, file), 'utf8');
    try {
      const parsed = JSON.parse(contents) as Snapshot;
      if (parsed && Array.isArray(parsed.chains)) snapshots.push(parsed);
    } catch {
      // skip malformed
    }
  }

  return snapshots.sort((a, b) => a.captureDate.localeCompare(b.captureDate));
}

function indexByChainId(snapshot: Snapshot): Map<number, HistoricalChain> {
  const map = new Map<number, HistoricalChain>();
  for (const chain of snapshot.chains) {
    map.set(chain.chainId, chain);
  }
  return map;
}

export function diffSnapshots(previous: Snapshot, next: Snapshot): TierChange[] {
  const prevIndex = indexByChainId(previous);
  const changes: TierChange[] = [];

  for (const chain of next.chains) {
    if (chain.isTestnet || chain.isDeprecated) continue;
    const prev = prevIndex.get(chain.chainId);
    if (!prev) continue;
    if (prev.riskLevel === chain.riskLevel) continue;

    const prevRank = RISK_ORDER[prev.riskLevel] ?? 0;
    const nextRank = RISK_ORDER[chain.riskLevel] ?? 0;
    if (prevRank === nextRank) continue;

    changes.push({
      chainId: chain.chainId,
      name: chain.name,
      fromDate: previous.captureDate,
      toDate: next.captureDate,
      fromRiskLevel: prev.riskLevel,
      toRiskLevel: chain.riskLevel,
      fromDistinctProviders: prev.distinctProviders,
      toDistinctProviders: chain.distinctProviders,
      direction: nextRank > prevRank ? 'worse' : 'better',
      tvlUsd: chain.tvlUsd,
    });
  }

  return changes;
}

export type HistoryState = {
  snapshots: Snapshot[];
  latest: Snapshot | null;
  previous: Snapshot | null;
  recentChanges: TierChange[];
};

export async function loadHistoryState(): Promise<HistoryState> {
  const snapshots = await loadSnapshots();
  if (snapshots.length === 0) {
    return { snapshots, latest: null, previous: null, recentChanges: [] };
  }
  const latest = snapshots[snapshots.length - 1];
  const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

  // Aggregate changes across the last 30 snapshots. Keyed by chainId to
  // dedupe back-and-forth churn (a chain that flipped twice shows the
  // latest tier it landed on).
  const window = snapshots.slice(-30);
  const byChain = new Map<number, TierChange>();
  for (let i = 1; i < window.length; i += 1) {
    const changes = diffSnapshots(window[i - 1], window[i]);
    for (const change of changes) {
      byChain.set(change.chainId, change);
    }
  }

  const recentChanges = Array.from(byChain.values()).sort((a, b) => {
    // Worsening changes first, then by TVL descending.
    if (a.direction !== b.direction) {
      return a.direction === 'worse' ? -1 : 1;
    }
    const aTvl = a.tvlUsd ?? 0;
    const bTvl = b.tvlUsd ?? 0;
    if (aTvl !== bTvl) return bTvl - aTvl;
    return a.name.localeCompare(b.name);
  });

  return { snapshots, latest, previous, recentChanges };
}
