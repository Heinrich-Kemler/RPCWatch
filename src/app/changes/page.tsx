import Link from 'next/link';
import type { Metadata } from 'next';

import { formatCompactUsd } from '../../lib/format';
import { loadHistoryState, type TierChange } from '../../lib/history';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Tier changes — RPC Watch',
  description:
    'Chains that shifted risk tier in the last 30 days — a feed of chains that lost or gained RPC redundancy.',
};

const TIER_LABEL: Record<string, string> = {
  critical: 'Critical',
  'at-risk': 'At risk',
  safe: 'Safe',
  'no-data': 'No data',
};

const TIER_CLASS: Record<string, string> = {
  critical: 'bg-red-50 text-critical border-red-200',
  'at-risk': 'bg-orange-50 text-warning border-orange-200',
  safe: 'bg-green-50 text-safe border-green-200',
  'no-data': 'bg-slate-100 text-muted border-slate-200',
};

function tierChip(tier: string) {
  const label = TIER_LABEL[tier] ?? tier;
  const cls = TIER_CLASS[tier] ?? TIER_CLASS['no-data'];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${cls}`}
    >
      {label}
    </span>
  );
}

export default async function ChangesPage() {
  const history = await loadHistoryState();
  const worseChanges = history.recentChanges.filter((c) => c.direction === 'worse');
  const betterChanges = history.recentChanges.filter((c) => c.direction === 'better');

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/" className="hover:text-text">
            ← Back to all chains
          </Link>
        </nav>

        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">The watch log</div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Tier changes in the last 30 days
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">
            Every day we snapshot the full dataset and diff it against the previous day. Chains
            that moved to a <span className="font-semibold text-critical">worse</span> tier or
            recovered to a <span className="font-semibold text-safe">better</span> one show up
            here.
          </p>
        </header>

        {history.snapshots.length === 0 && (
          <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
            <div className="text-sm text-muted">
              No snapshots recorded yet. Once the daily GitHub Action starts running, tier changes
              will appear here.
            </div>
          </section>
        )}

        {history.snapshots.length === 1 && (
          <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
            <div className="text-sm text-muted">
              Only one snapshot so far ({history.snapshots[0].captureDate}). Tier changes will start
              appearing after the second daily snapshot.
            </div>
          </section>
        )}

        {history.snapshots.length >= 2 && history.recentChanges.length === 0 && (
          <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
            <div className="text-sm text-muted">
              No tier changes in the last 30 days.
            </div>
          </section>
        )}

        {worseChanges.length > 0 && (
          <ChangeList
            title="Chains that lost redundancy"
            subtitle="Moved to a worse risk tier within the last 30 days."
            tone="critical"
            changes={worseChanges}
          />
        )}

        {betterChanges.length > 0 && (
          <ChangeList
            title="Chains that gained redundancy"
            subtitle="Recovered to a better risk tier within the last 30 days."
            tone="safe"
            changes={betterChanges}
          />
        )}

        {history.snapshots.length > 0 && (
          <section className="mt-10 rounded-2xl border border-border bg-surface p-5 text-xs text-muted">
            <strong className="text-text">History footprint.</strong>{' '}
            {history.snapshots.length} snapshot{history.snapshots.length === 1 ? '' : 's'} recorded.
            Oldest: {history.snapshots[0].captureDate}. Latest:{' '}
            {history.snapshots[history.snapshots.length - 1].captureDate}. Raw JSON lives under{' '}
            <code className="rounded bg-card px-1">data/snapshots/</code> in the repo for anyone
            who wants to audit the trail.
          </section>
        )}
      </div>
    </main>
  );
}

function ChangeList({
  title,
  subtitle,
  tone,
  changes,
}: {
  title: string;
  subtitle: string;
  tone: 'critical' | 'safe';
  changes: TierChange[];
}) {
  const accent = tone === 'critical' ? 'text-critical' : 'text-safe';
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className={`text-lg font-semibold ${accent}`}>{title}</h2>
        <p className="mt-1 text-xs text-muted">{subtitle}</p>
      </div>
      <ul className="divide-y divide-border">
        {changes.map((change) => (
          <li
            key={`${change.chainId}-${change.toDate}`}
            className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-[2fr_auto_auto_auto] md:items-center md:gap-4"
          >
            <div className="min-w-0">
              <Link
                href={`/chain/${change.chainId}`}
                className="block truncate font-semibold text-text hover:text-accent"
              >
                {change.name}
              </Link>
              <div className="text-xs text-muted">
                {change.fromDate} → {change.toDate} ·{' '}
                {change.fromDistinctProviders} → {change.toDistinctProviders} providers
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tierChip(change.fromRiskLevel)}
              <span className="text-xs text-muted">→</span>
              {tierChip(change.toRiskLevel)}
            </div>
            <div className="text-right text-sm">
              {change.tvlUsd !== null && change.tvlUsd > 0 ? (
                <span className="whitespace-nowrap rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-critical">
                  {formatCompactUsd(change.tvlUsd)}
                </span>
              ) : (
                <span className="text-xs text-muted">—</span>
              )}
            </div>
            <Link
              href={`/chain/${change.chainId}`}
              className="hidden shrink-0 rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent md:inline-block"
            >
              Details ↗
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
