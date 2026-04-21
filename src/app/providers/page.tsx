import Link from 'next/link';
import type { Metadata } from 'next';

import { getCachedChains } from '../../lib/chains.server';
import { formatCompactUsd } from '../../lib/format';
import { buildProviderAggregates, type ProviderAggregate } from '../../lib/providerAggregate';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Providers — RPC Watch',
  description:
    'Ranked list of RPC providers by systemic risk: how many chains they are the sole provider for, and how much value rides on them.',
};

export default async function ProvidersPage() {
  const chains = await getCachedChains();
  const aggregates = buildProviderAggregates(chains);

  const withSoleChains = aggregates.filter((a) => a.soleProviderChains.length > 0);
  const topByTvl = withSoleChains
    .filter((a) => a.soleProviderTvlUsd > 0)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/" className="hover:text-text">
            ← Back to all chains
          </Link>
        </nav>

        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">Provider dependency graph</div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Who does <span className="text-critical">crypto</span> actually depend on?
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">
            Every chain listed on RPC Watch depends on one or more RPC operators. These are the
            operators, ranked by how much risk they concentrate — the chains where they are the{' '}
            <span className="font-semibold text-text">sole</span> public provider, and the TVL
            sitting on those chains.
          </p>
        </header>

        {topByTvl.length > 0 && (
          <section className="mb-10 overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-card shadow-card">
            <div className="px-6 pt-6">
              <h2 className="text-xl font-semibold text-text">Biggest blast radii</h2>
              <p className="mt-1 text-sm text-muted">
                Providers by TVL on chains where they are the only public operator. If they go
                offline, this is the dollar amount that can&apos;t read its own chain.
              </p>
            </div>
            <ol className="mt-4 divide-y divide-red-100 border-t border-red-100">
              {topByTvl.map((aggregate, index) => (
                <li
                  key={aggregate.id}
                  className="grid grid-cols-[2.4rem_1fr_auto_auto] items-center gap-4 px-6 py-3 text-sm"
                >
                  <span className="font-mono text-xs text-muted">#{index + 1}</span>
                  <Link
                    href={`/provider/${encodeURIComponent(aggregate.id)}`}
                    className="min-w-0 hover:text-critical"
                  >
                    <span className="block truncate font-semibold text-text">{aggregate.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {aggregate.soleProviderChains.length} chain
                      {aggregate.soleProviderChains.length === 1 ? '' : 's'} depend solely on this
                      operator
                    </span>
                  </Link>
                  <span className="whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-critical">
                    {formatCompactUsd(aggregate.soleProviderTvlUsd)}
                  </span>
                  <Link
                    href={`/provider/${encodeURIComponent(aggregate.id)}`}
                    className="hidden shrink-0 rounded-md border border-border bg-card px-3 py-1 text-xs text-muted hover:text-critical sm:inline-block"
                  >
                    Details ↗
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="hidden grid-cols-[2fr_0.9fr_0.9fr_0.9fr_0.9fr_0.4fr] gap-4 border-b border-border bg-surface px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted md:grid">
            <div>Provider</div>
            <div>Sole-of chains</div>
            <div>Shared chains</div>
            <div>Total URLs</div>
            <div>Sole-of TVL</div>
            <div />
          </div>
          <ul className="divide-y divide-border">
            {aggregates.map((aggregate) => (
              <ProviderRow key={aggregate.id} aggregate={aggregate} />
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-xs text-muted">
          <strong className="text-text">How to read this.</strong> Providers are identified by a
          curated hostname → operator map. URLs whose apex isn&apos;t in the map are grouped by
          apex and marked &ldquo;Apex&rdquo;; we don&apos;t assume two strangers sharing an apex
          are the same operator unless the map confirms it. This is conservative. A chain counts
          toward a provider&apos;s &ldquo;sole&rdquo; tally only if every public RPC on that chain
          resolves to this provider.
        </section>
      </div>
    </main>
  );
}

function ProviderRow({ aggregate }: { aggregate: ProviderAggregate }) {
  const soleCount = aggregate.soleProviderChains.length;
  const sharedCount = aggregate.sharedProviderChains.length;
  return (
    <li className="grid grid-cols-1 gap-2 px-5 py-4 transition hover:bg-surface/60 md:grid-cols-[2fr_0.9fr_0.9fr_0.9fr_0.9fr_0.4fr] md:items-center md:gap-4">
      <div className="min-w-0">
        <Link
          href={`/provider/${encodeURIComponent(aggregate.id)}`}
          className="block truncate font-medium text-text hover:text-accent"
        >
          {aggregate.name}
        </Link>
        <div className="mt-1 flex items-center gap-2 text-[0.65rem] uppercase tracking-wider">
          {aggregate.verified ? (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-accent">
              Verified operator
            </span>
          ) : (
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-semibold text-muted">
              Apex grouping
            </span>
          )}
        </div>
      </div>
      <div className="text-sm">
        <span className={`font-semibold ${soleCount > 0 ? 'text-critical' : 'text-muted'}`}>
          {soleCount}
        </span>
        <span className="ml-1 text-xs text-muted md:hidden">sole-provider chains</span>
      </div>
      <div className="text-sm">
        <span className="font-semibold text-text">{sharedCount}</span>
        <span className="ml-1 text-xs text-muted md:hidden">shared chains</span>
      </div>
      <div className="text-sm">
        <span className="font-semibold text-text">{aggregate.totalUrls}</span>
        <span className="ml-1 text-xs text-muted md:hidden">URLs</span>
      </div>
      <div className="text-sm">
        <span
          className={`font-semibold ${aggregate.soleProviderTvlUsd > 0 ? 'text-critical' : 'text-muted'}`}
        >
          {aggregate.soleProviderTvlUsd > 0 ? formatCompactUsd(aggregate.soleProviderTvlUsd) : '—'}
        </span>
        <span className="ml-1 text-xs text-muted md:hidden">TVL on sole chains</span>
      </div>
      <div className="flex md:justify-end">
        <Link
          href={`/provider/${encodeURIComponent(aggregate.id)}`}
          className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted hover:border-accent hover:text-accent"
        >
          Details ↗
        </Link>
      </div>
    </li>
  );
}
