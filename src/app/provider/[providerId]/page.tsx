import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getCachedChains } from '../../../lib/chains.server';
import { formatCompactUsd } from '../../../lib/format';
import {
  buildProviderAggregates,
  type ProviderAggregate,
} from '../../../lib/providerAggregate';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ providerId: string }>;
};

async function resolveAggregate(params: PageProps['params']): Promise<ProviderAggregate | null> {
  const { providerId } = await params;
  const decoded = decodeURIComponent(providerId);
  const chains = await getCachedChains();
  const aggregates = buildProviderAggregates(chains);
  return aggregates.find((entry) => entry.id === decoded) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const aggregate = await resolveAggregate(params);
  if (!aggregate) return { title: 'Provider not found — RPC Watch' };
  const soleCount = aggregate.soleProviderChains.length;
  return {
    title: `${aggregate.name} — RPC Watch`,
    description: `${aggregate.name} is the sole public RPC provider for ${soleCount} chain${soleCount === 1 ? '' : 's'} on RPC Watch.`,
  };
}

export default async function ProviderDetailPage({ params }: PageProps) {
  const aggregate = await resolveAggregate(params);
  if (!aggregate) notFound();

  const soleSorted = [...aggregate.soleProviderChains].sort(
    (a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0),
  );
  const sharedSorted = [...aggregate.sharedProviderChains].sort(
    (a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0),
  );

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/providers" className="hover:text-text">
            ← All providers
          </Link>
          <span className="mx-2">·</span>
          <Link href="/" className="hover:text-text">
            Home
          </Link>
        </nav>

        <header className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {aggregate.verified ? (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold uppercase tracking-wider text-accent">
                    Verified operator
                  </span>
                ) : (
                  <span className="rounded-full border border-border bg-surface px-2.5 py-1 font-semibold uppercase tracking-wider text-muted">
                    Apex grouping
                  </span>
                )}
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 font-mono">
                  {aggregate.id}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{aggregate.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                {aggregate.soleProviderChains.length > 0 ? (
                  <>
                    Sole public RPC provider for{' '}
                    <span className="font-semibold text-text">
                      {aggregate.soleProviderChains.length}
                    </span>{' '}
                    chain{aggregate.soleProviderChains.length === 1 ? '' : 's'}. If this operator
                    goes offline, those chains go dark for every wallet and dApp.
                  </>
                ) : (
                  <>
                    Currently shared with other providers across every chain we see — no single
                    chain depends on {aggregate.name} alone.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Sole-provider chains"
              value={aggregate.soleProviderChains.length.toLocaleString()}
              tone={aggregate.soleProviderChains.length > 0 ? 'critical' : 'muted'}
            />
            <MetricCard
              label="Sole-provider TVL"
              value={
                aggregate.soleProviderTvlUsd > 0
                  ? formatCompactUsd(aggregate.soleProviderTvlUsd)
                  : '—'
              }
              tone={aggregate.soleProviderTvlUsd > 0 ? 'critical' : 'muted'}
            />
            <MetricCard
              label="Chains touched (total)"
              value={aggregate.chainCount.toLocaleString()}
              tone="neutral"
              hint={`${aggregate.totalUrls} public URLs`}
            />
          </div>
        </header>

        {soleSorted.length > 0 && (
          <ChainList
            title="Sole-provider chains"
            subtitle="These chains run on this operator alone — losing them loses the chain."
            chains={soleSorted}
            tone="critical"
          />
        )}

        {sharedSorted.length > 0 && (
          <ChainList
            title="Shared-provider chains"
            subtitle="This operator is one of several public RPCs on these chains."
            chains={sharedSorted}
            tone="muted"
          />
        )}

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-xs text-muted">
          <strong className="text-text">How this number is built.</strong> We identify providers
          by matching each RPC URL&apos;s hostname against a curated map of operators ({' '}
          <code className="rounded bg-card px-1">src/lib/providers.ts</code> in the repo). Verified
          entries come from that map. Apex groupings collapse URLs on the same domain that we
          haven&apos;t manually verified — conservative, but safer than assuming two unrelated
          projects on the same TLD share infrastructure.
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: 'critical' | 'muted' | 'neutral';
  hint?: string;
}) {
  const toneClass =
    tone === 'critical' ? 'text-critical' : tone === 'muted' ? 'text-muted' : 'text-text';
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

function ChainList({
  title,
  subtitle,
  chains,
  tone,
}: {
  title: string;
  subtitle: string;
  chains: ProviderAggregate['soleProviderChains'];
  tone: 'critical' | 'muted';
}) {
  const accent = tone === 'critical' ? 'text-critical' : 'text-text';
  return (
    <section className="mt-8 rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className={`text-lg font-semibold ${accent}`}>{title}</h2>
        <p className="mt-1 text-xs text-muted">{subtitle}</p>
      </div>
      <ul className="divide-y divide-border">
        {chains.map((chain) => (
          <li key={chain.chainId} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="min-w-0">
              <Link href={`/chain/${chain.chainId}`} className="block truncate font-medium text-text hover:text-accent">
                {chain.name}
              </Link>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-mono">{chain.isNonEvm ? chain.arch : `#${chain.chainId}`}</span>
                <span>· {chain.publicRpcCount} URL{chain.publicRpcCount === 1 ? '' : 's'}</span>
                <span>· {chain.distinctProviders} provider{chain.distinctProviders === 1 ? '' : 's'}</span>
              </div>
            </div>
            {chain.tvlUsd !== null && chain.tvlUsd > 0 && (
              <span className="whitespace-nowrap rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-critical">
                {formatCompactUsd(chain.tvlUsd)}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
