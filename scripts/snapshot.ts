import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { getProcessedChainBundle } from '../src/lib/chains';

type SnapshotEntry = {
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

type SnapshotFile = {
  version: 1;
  capturedAt: string;
  captureDate: string;
  summary: {
    totalChains: number;
    critical: number;
    atRisk: number;
    safe: number;
    noData: number;
  };
  chains: SnapshotEntry[];
};

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function main() {
  const { chains } = await getProcessedChainBundle();
  const now = new Date();

  const entries: SnapshotEntry[] = chains.map((chain) => ({
    chainId: chain.chainId,
    name: chain.name,
    shortName: chain.shortName,
    arch: chain.arch,
    isNonEvm: chain.isNonEvm,
    isTestnet: chain.isTestnet,
    isDeprecated: chain.isDeprecated,
    distinctProviders: chain.distinctProviders,
    publicRpcCount: chain.publicRpcCount,
    riskLevel: chain.riskLevel,
    tvlUsd: chain.tvlUsd,
    providerIds: chain.providerGroups.map((group) => group.id),
  }));

  const summary = {
    totalChains: entries.length,
    critical: entries.filter((e) => e.distinctProviders === 1 && !e.isTestnet && !e.isDeprecated).length,
    atRisk: entries.filter(
      (e) => e.distinctProviders >= 2 && e.distinctProviders <= 3 && !e.isTestnet && !e.isDeprecated,
    ).length,
    safe: entries.filter((e) => e.distinctProviders >= 4 && !e.isTestnet && !e.isDeprecated).length,
    noData: entries.filter((e) => e.distinctProviders === 0 && !e.isTestnet && !e.isDeprecated).length,
  };

  const snapshot: SnapshotFile = {
    version: 1,
    capturedAt: now.toISOString(),
    captureDate: formatDate(now),
    summary,
    chains: entries,
  };

  const snapshotDir = path.join(process.cwd(), 'data', 'snapshots');
  await mkdir(snapshotDir, { recursive: true });
  const file = path.join(snapshotDir, `${snapshot.captureDate}.json`);
  await writeFile(file, `${JSON.stringify(snapshot)}\n`, 'utf8');

  console.log(`wrote ${file}`);
  console.log(
    `totalChains=${summary.totalChains} critical=${summary.critical} atRisk=${summary.atRisk} safe=${summary.safe} noData=${summary.noData}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
