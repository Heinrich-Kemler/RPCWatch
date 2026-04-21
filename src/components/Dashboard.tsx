'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { ProcessedChain } from '../lib/chains';
import { SIGNIFICANT_TVL_USD } from '../lib/chains';
import { formatCompactUsd } from '../lib/format';
import { riskPalette, rpcCountPalette } from '../lib/risk';
import type { SourceFetchSummary } from '../lib/sources';

type FilterKey = 'all' | 'critical' | 'at-risk' | 'safe';

type DashboardProps = {
  chains: ProcessedChain[];
  summary: SourceFetchSummary;
};

const FILTERS: { key: FilterKey; label: string; matches: (chain: ProcessedChain) => boolean }[] = [
  { key: 'all', label: 'All', matches: () => true },
  {
    key: 'critical',
    label: 'Critical (1 provider)',
    matches: (chain) => chain.distinctProviders === 1,
  },
  {
    key: 'at-risk',
    label: 'At Risk (2–3)',
    matches: (chain) => chain.distinctProviders >= 2 && chain.distinctProviders <= 3,
  },
  {
    key: 'safe',
    label: 'Safe (4+)',
    matches: (chain) => chain.distinctProviders >= 4,
  },
];

function formatProviderLabel(count: number): string {
  if (count === 0) return '0 providers';
  if (count === 1) return '1 provider';
  return `${count} providers`;
}

function tabCount(chains: ProcessedChain[], key: FilterKey): number {
  const filter = FILTERS.find((entry) => entry.key === key);
  return filter ? chains.filter(filter.matches).length : 0;
}

export default function Dashboard({ chains, summary }: DashboardProps) {
  const [filter, setFilter] = useState<FilterKey>('critical');
  const [query, setQuery] = useState('');
  const [showTestnets, setShowTestnets] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const isActive = (chain: ProcessedChain): boolean =>
    chain.isNotable || (chain.tvlUsd !== null && chain.tvlUsd >= SIGNIFICANT_TVL_USD);

  const visibleUniverse = useMemo(
    () =>
      chains.filter((chain) => {
        if (chain.isDeprecated) return false;
        if (!showTestnets && chain.isTestnet) return false;
        if (activeOnly && !isActive(chain)) return false;
        return true;
      }),
    [chains, showTestnets, activeOnly],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matcher = FILTERS.find((entry) => entry.key === filter)?.matches ?? (() => true);
    const safestFirst = filter === 'safe';

    return visibleUniverse
      .filter(matcher)
      .filter((chain) => {
        if (!normalizedQuery) return true;
        if (chain.name.toLowerCase().includes(normalizedQuery)) return true;
        if (chain.shortName.toLowerCase().includes(normalizedQuery)) return true;
        if (String(chain.chainId).includes(normalizedQuery)) return true;
        if (chain.rpc.some((url) => url.toLowerCase().includes(normalizedQuery))) return true;
        return false;
      })
      .sort((left, right) => {
        // 1. Pin notable names to the top
        if (left.isNotable !== right.isNotable) {
          return left.isNotable ? -1 : 1;
        }
        // 2. Rank by TVL descending so high-stakes chains surface first
        const leftTvl = left.tvlUsd ?? 0;
        const rightTvl = right.tvlUsd ?? 0;
        if (leftTvl !== rightTvl) {
          return rightTvl - leftTvl;
        }
        // 3. Break remaining ties by provider count (asc for danger tabs, desc for Safe)
        if (left.distinctProviders !== right.distinctProviders) {
          return safestFirst
            ? right.distinctProviders - left.distinctProviders
            : left.distinctProviders - right.distinctProviders;
        }
        return left.name.localeCompare(right.name);
      });
  }, [visibleUniverse, filter, query]);

  const criticalChains = useMemo(
    () => visibleUniverse.filter((chain) => chain.distinctProviders === 1),
    [visibleUniverse],
  );

  const stats = useMemo(() => {
    const total = visibleUniverse.length;
    const critical = visibleUniverse.filter((chain) => chain.distinctProviders === 1).length;
    const atRisk = visibleUniverse.filter(
      (chain) => chain.distinctProviders >= 2 && chain.distinctProviders <= 3,
    ).length;
    const safe = visibleUniverse.filter((chain) => chain.distinctProviders >= 4).length;
    const noData = visibleUniverse.filter((chain) => chain.distinctProviders === 0).length;
    return { total, critical, atRisk, safe, noData };
  }, [visibleUniverse]);

  const criticalWithTvl = useMemo(() => {
    return visibleUniverse
      .filter(
        (chain) =>
          chain.distinctProviders === 1 &&
          chain.tvlUsd !== null &&
          chain.tvlUsd >= SIGNIFICANT_TVL_USD,
      )
      .sort((left, right) => (right.tvlUsd ?? 0) - (left.tvlUsd ?? 0))
      .slice(0, 10);
  }, [visibleUniverse]);

  const highlightedCritical = useMemo(() => {
    const notable = criticalChains.filter((chain) => chain.isNotable);
    if (notable.length >= 6) return notable.slice(0, 6);
    const extras = criticalChains
      .filter((chain) => !chain.isNotable)
      .slice(0, 6 - notable.length);
    return [...notable, ...extras];
  }, [criticalChains]);

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
        <Hero stats={stats} />

        <Disclaimer summary={summary} />

        <Methodology />

        <SearchAndFilters
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          showTestnets={showTestnets}
          setShowTestnets={setShowTestnets}
          activeOnly={activeOnly}
          setActiveOnly={setActiveOnly}
          universe={visibleUniverse}
        />

        {filter === 'critical' && criticalWithTvl.length > 0 && (
          <TvlLeaderboard chains={criticalWithTvl} />
        )}

        {filter === 'critical' && highlightedCritical.length > 0 && (
          <CriticalCallout chains={highlightedCritical} totalCritical={criticalChains.length} />
        )}

        <ChainTable
          chains={filtered}
          expanded={expanded}
          onToggle={(chainId) =>
            setExpanded((previous) => ({ ...previous, [chainId]: !previous[chainId] }))
          }
        />
      </div>

      <Footer />
    </main>
  );
}

function Hero({
  stats,
}: {
  stats: { total: number; critical: number; atRisk: number; safe: number; noData: number };
}) {
  return (
    <header className="mb-10">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 shadow-sm">
        <span className="relative flex h-2 w-2 items-center justify-center">
          <span className="absolute h-2 w-2 rounded-full bg-critical pulse-critical" />
          <span className="relative h-2 w-2 rounded-full bg-critical" />
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          Live · chainid.network
        </span>
      </div>

      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        RPC <span className="text-critical">Watch</span>
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Which blockchains are one outage away from going dark?{' '}
        <Link
          href="/providers"
          className="whitespace-nowrap font-semibold text-accent hover:underline"
        >
          See who depends on whom →
        </Link>
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Chains monitored" value={stats.total} tone="text" />
        <StatTile label="Critical (1 RPC)" value={stats.critical} tone="critical" />
        <StatTile label="At risk (2–3)" value={stats.atRisk} tone="warning" />
        <StatTile label="Well covered (4+)" value={stats.safe} tone="safe" />
      </div>
    </header>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'critical' | 'warning' | 'safe' | 'text';
}) {
  const toneClass =
    tone === 'critical'
      ? 'text-critical'
      : tone === 'warning'
      ? 'text-warning'
      : tone === 'safe'
      ? 'text-safe'
      : 'text-text';

  const borderClass =
    tone === 'critical'
      ? 'border-red-100'
      : tone === 'warning'
      ? 'border-orange-100'
      : tone === 'safe'
      ? 'border-green-100'
      : 'border-border';

  return (
    <div className={`rounded-2xl border ${borderClass} bg-card px-5 py-6 shadow-card`}>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-2 text-3xl font-semibold sm:text-4xl ${toneClass}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function SearchAndFilters({
  filter,
  setFilter,
  query,
  setQuery,
  showTestnets,
  setShowTestnets,
  activeOnly,
  setActiveOnly,
  universe,
}: {
  filter: FilterKey;
  setFilter: (key: FilterKey) => void;
  query: string;
  setQuery: (value: string) => void;
  showTestnets: boolean;
  setShowTestnets: (value: boolean) => void;
  activeOnly: boolean;
  setActiveOnly: (value: boolean) => void;
  universe: ProcessedChain[];
}) {
  return (
    <section className="sticky top-0 z-10 -mx-6 mb-6 bg-bg/90 px-6 pb-4 pt-2 backdrop-blur">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, chain ID, or RPC URL…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted focus:border-accent focus:bg-card focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </div>

        <label
          className="flex shrink-0 items-center gap-2 text-sm text-muted"
          title="Only show chains with >= $1M TVL on DefiLlama or on our notable-chain list. Dead chains are hidden."
        >
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(event) => setActiveOnly(event.target.checked)}
            className="h-4 w-4 rounded border-border bg-card accent-accent"
          />
          Active chains only
        </label>

        <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showTestnets}
            onChange={(event) => setShowTestnets(event.target.checked)}
            className="h-4 w-4 rounded border-border bg-card accent-accent"
          />
          Include testnets
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((entry) => {
          const count = tabCount(universe, entry.key);
          const active = filter === entry.key;
          const activeStyle =
            entry.key === 'critical'
              ? 'border-red-300 bg-red-50 text-critical'
              : entry.key === 'at-risk'
              ? 'border-orange-300 bg-orange-50 text-warning'
              : entry.key === 'safe'
              ? 'border-green-300 bg-green-50 text-safe'
              : 'border-slate-300 bg-card text-text';
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFilter(entry.key)}
              className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                active ? activeStyle : 'border-border bg-card text-muted hover:text-text'
              }`}
            >
              {entry.label}
              <span className="ml-2 text-[0.7rem] text-muted">{count.toLocaleString()}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CriticalCallout({
  chains,
  totalCritical,
}: {
  chains: ProcessedChain[];
  totalCritical: number;
}) {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-card p-6 shadow-card">
      <div className="flex items-start gap-3">
        <span className="relative flex h-2.5 w-2.5 translate-y-2 items-center justify-center">
          <span className="absolute h-2.5 w-2.5 rounded-full bg-critical pulse-critical" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-critical" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-critical">
            Critical: Single RPC Chains
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            These chains have exactly one public RPC endpoint. If it goes offline, the chain
            effectively becomes unreachable for most users — wallets, dApps, and bridges all depend
            on the same endpoint.{' '}
            <span className="font-semibold text-text">
              {totalCritical.toLocaleString()}
            </span>{' '}
            chains in total.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => (
          <div
            key={chain.chainId}
            className="group rounded-xl border border-red-100 bg-card p-4 shadow-sm transition hover:border-red-300 hover:shadow-lift"
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                href={`/chain/${chain.chainId}`}
                className="flex min-w-0 items-center gap-2"
              >
                <span className="truncate text-sm font-semibold text-text group-hover:text-critical">
                  {chain.name}
                </span>
                {chain.isNotable && (
                  <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
                    Notable
                  </span>
                )}
              </Link>
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
                {chain.infoURL && (
                  <a
                    href={chain.infoURL}
                    target="_blank"
                    rel="noreferrer"
                    title={`Open ${chain.name} website`}
                    aria-label={`Open ${chain.name} website`}
                    className="hover:text-critical"
                  >
                    <span aria-hidden>↗</span>
                  </a>
                )}
                <span>#{chain.chainId}</span>
              </div>
            </div>
            <Link
              href={`/chain/${chain.chainId}`}
              className="mt-3 block truncate font-mono text-xs text-muted group-hover:text-text"
              title={chain.publicRpcs[0]}
            >
              {chain.publicRpcs[0]}
            </Link>
            {chain.tvlUsd !== null && chain.tvlUsd >= SIGNIFICANT_TVL_USD && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-critical">
                {formatCompactUsd(chain.tvlUsd)} TVL at risk
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TvlLeaderboard({ chains }: { chains: ProcessedChain[] }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-card shadow-card">
      <div className="flex items-start gap-3 px-6 pt-6">
        <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-critical">
          $
        </span>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-text">Single-provider chains by TVL</h2>
          <p className="mt-1 text-sm text-muted">
            Chains with all public RPCs behind <span className="font-semibold text-text">one</span>{' '}
            operator AND ≥ $1M on-chain value. If the provider goes offline, this much value loses
            access to its own chain.
          </p>
        </div>
      </div>
      <ol className="mt-4 divide-y divide-border border-t border-red-100">
        {chains.map((chain, index) => {
          const provider = chain.providerGroups[0];
          return (
            <li key={chain.chainId} className="grid grid-cols-[2.4rem_1fr_auto] items-center gap-3 px-6 py-3 text-sm">
              <span className="font-mono text-xs text-muted">#{index + 1}</span>
              <div className="min-w-0">
                <Link
                  href={`/chain/${chain.chainId}`}
                  className="block truncate font-semibold text-text hover:text-critical"
                >
                  {chain.name}
                </Link>
                <span className="block truncate text-xs text-muted">
                  Sole provider:{' '}
                  {provider ? (
                    <Link
                      href={`/provider/${encodeURIComponent(provider.id)}`}
                      className="font-medium text-text hover:underline"
                    >
                      {provider.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-text">—</span>
                  )}
                </span>
              </div>
              <span className="whitespace-nowrap rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-critical">
                {formatCompactUsd(chain.tvlUsd ?? 0)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ChainTable({
  chains,
  expanded,
  onToggle,
}: {
  chains: ProcessedChain[];
  expanded: Record<number, boolean>;
  onToggle: (chainId: number) => void;
}) {
  if (chains.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
        <div className="text-sm text-muted">No chains match this filter.</div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="hidden grid-cols-[1.8fr_0.6fr_0.7fr_0.9fr_1.5fr_0.6fr] gap-4 border-b border-border bg-surface px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted md:grid">
        <div>Chain</div>
        <div>Chain ID</div>
        <div>Providers</div>
        <div>Risk</div>
        <div>RPCs</div>
        <div className="text-right">Explorer</div>
      </div>

      <ul className="divide-y divide-border">
        {chains.map((chain) => (
          <ChainRow
            key={chain.chainId}
            chain={chain}
            expanded={Boolean(expanded[chain.chainId])}
            onToggle={() => onToggle(chain.chainId)}
          />
        ))}
      </ul>
    </section>
  );
}

function ChainRow({
  chain,
  expanded,
  onToggle,
}: {
  chain: ProcessedChain;
  expanded: boolean;
  onToggle: () => void;
}) {
  const riskStyle = riskPalette(chain.riskLevel);
  const countStyle = rpcCountPalette(chain.distinctProviders);
  const explorer = chain.explorers[0];
  const initial = chain.name.charAt(0).toUpperCase();
  const soleProvider = chain.distinctProviders === 1 ? chain.providerGroups[0] : null;
  const allRpcsSameProvider = chain.publicRpcCount >= 2 && chain.distinctProviders === 1;

  return (
    <li className="grid grid-cols-1 gap-3 px-5 py-4 transition hover:bg-surface/60 md:grid-cols-[1.8fr_0.6fr_0.7fr_0.9fr_1.5fr_0.6fr] md:items-center md:gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold ${countStyle.text}`}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/chain/${chain.chainId}`}
              className="truncate font-medium text-text hover:text-accent"
            >
              {chain.name}
            </Link>
            {chain.infoURL && (
              <a
                href={chain.infoURL}
                target="_blank"
                rel="noreferrer"
                title={`Open ${chain.name} website`}
                aria-label={`Open ${chain.name} website`}
                className="shrink-0 text-muted hover:text-accent"
              >
                <span aria-hidden>↗</span>
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="truncate">{chain.nativeCurrency.symbol}</span>
            {chain.isNotable && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
                Notable
              </span>
            )}
            {chain.isTestnet && (
              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted">
                Testnet
              </span>
            )}
            {chain.tvlUsd !== null && chain.tvlUsd >= SIGNIFICANT_TVL_USD && (
              <span
                className="rounded-full bg-green-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-safe"
                title="TVL reported by chainlist.org (via DefiLlama)"
              >
                TVL {formatCompactUsd(chain.tvlUsd)}
              </span>
            )}
            {chain.sources.length > 1 && (
              <span
                className="rounded-full border border-border bg-surface px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted"
                title="Present in more than one registry"
              >
                {chain.sources.length} sources
              </span>
            )}
            {chain.isNonEvm && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700">
                {chain.arch}
              </span>
            )}
            {allRpcsSameProvider && soleProvider && (
              <Link
                href={`/provider/${encodeURIComponent(soleProvider.id)}`}
                className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-critical hover:underline"
                title={`All ${chain.publicRpcCount} public RPCs resolve to ${soleProvider.name}`}
              >
                All via {soleProvider.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center md:block">
        <span className="font-mono text-xs text-muted md:hidden">Chain ID · </span>
        <span className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-xs text-text">
          {chain.isNonEvm ? chain.arch : chain.chainId}
        </span>
      </div>

      <div>
        <span className={`text-2xl font-semibold ${countStyle.text}`}>
          {chain.distinctProviders}
        </span>
        <span className="ml-1 text-xs text-muted">{formatProviderLabel(chain.distinctProviders)}</span>
        {chain.publicRpcCount !== chain.distinctProviders && chain.publicRpcCount > 0 && (
          <span className="ml-1 text-[0.65rem] text-muted">({chain.publicRpcCount} URLs)</span>
        )}
      </div>

      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider ${riskStyle.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${riskStyle.dot}`} />
          {riskStyle.label}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="w-max rounded-md border border-border bg-card px-3 py-1.5 text-xs text-text shadow-sm transition hover:border-accent hover:text-accent"
        >
          {expanded
            ? 'Hide RPCs'
            : `View ${chain.publicRpcCount} RPC${chain.publicRpcCount === 1 ? '' : 's'} · ${chain.distinctProviders} provider${chain.distinctProviders === 1 ? '' : 's'}`}
        </button>
        {expanded && (
          <ul className="space-y-1 text-xs">
            {chain.publicRpcs.length === 0 && (
              <li className="text-muted">
                No public RPCs. {chain.templateRpcs.length} require an API key.
              </li>
            )}
            {chain.publicRpcs.map((url) => (
              <li
                key={url}
                className="truncate rounded-md border border-border bg-surface px-2 py-1 font-mono text-muted"
                title={url}
              >
                {url}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex md:justify-end">
        {explorer ? (
          <a
            href={explorer.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted shadow-sm transition hover:border-accent hover:text-accent"
          >
            Explorer
            <span aria-hidden>↗</span>
          </a>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </div>
    </li>
  );
}

function Methodology() {
  return (
    <details className="group mb-8 rounded-2xl border border-border bg-card shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-text">
        <span className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-accent">
            ?
          </span>
          Methodology — how we classify chains
        </span>
        <span className="text-xs text-muted transition group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="grid gap-4 border-t border-border px-5 py-4 text-sm text-muted sm:grid-cols-2">
        <div>
          <div className="font-semibold text-text">Providers, not URLs</div>
          <p className="mt-1">
            We count distinct <span className="font-semibold text-text">providers</span> — not URLs.
            A chain listing <code className="rounded bg-surface px-1">rpc.orderly.network</code>{' '}
            and <code className="rounded bg-surface px-1">…conduit.xyz</code> looks like two until
            you notice Conduit operates both. Our provider map collapses URLs to their real
            operator so redundancy isn&apos;t over-counted. Template URLs with{' '}
            <code className="rounded bg-surface px-1">{'${VARIABLE}'}</code> are dropped — they
            require an API key and aren&apos;t usable by a stranger.
          </p>
        </div>
        <div>
          <div className="font-semibold text-text">Risk tiers</div>
          <p className="mt-1">
            <span className="font-semibold text-critical">Critical</span> = 1 provider ·{' '}
            <span className="font-semibold text-warning">At risk</span> = 2–3 ·{' '}
            <span className="font-semibold text-safe">Safe</span> = 4+. Risk is about redundancy,
            not endorsement — a safe chain can still have a bad operator in the list.
          </p>
        </div>
        <div>
          <div className="font-semibold text-text">TVL &amp; &ldquo;Active chains&rdquo;</div>
          <p className="mt-1">
            Every chain in both source registries is shown by default. For the ~12% of chains
            that DefiLlama tracks, we surface a <span className="font-semibold text-safe">TVL</span>{' '}
            badge when value ≥ $1M. Flip the &ldquo;Active chains only&rdquo; toggle to trim the
            list to chains with ≥ $1M TVL or on our notable-name pin list — useful when you want
            to focus on chains that actually hold assets.
          </p>
        </div>
        <div>
          <div className="font-semibold text-text">Sort order</div>
          <p className="mt-1">
            Notable names first, then by TVL descending, then by RPC count. On the Safe tab the
            most-covered chains come first; on Critical and At Risk the highest-TVL chains
            come first — because a single-RPC chain with $1B of assets at stake is more
            interesting than one with $0.
          </p>
        </div>
      </div>
    </details>
  );
}

function Disclaimer({ summary }: { summary: SourceFetchSummary }) {
  return (
    <section className="mb-8 flex gap-3 rounded-2xl border border-border bg-card p-5 text-sm shadow-card">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-semibold text-accent">
        i
      </div>
      <div className="text-muted">
        <span className="font-semibold text-text">Multi-source coverage.</span> RPC Watch merges{' '}
        <a
          href="https://chainlist.org/rpcs.json"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent hover:underline"
        >
          chainlist.org
        </a>{' '}
        and{' '}
        <a
          href="https://chainid.network/chains.json"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent hover:underline"
        >
          chainid.network
        </a>{' '}
        (
        <a
          href="https://github.com/ethereum-lists/chains"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent hover:underline"
        >
          ethereum-lists/chains
        </a>
        ), joins TVL from{' '}
        <a
          href="https://api.llama.fi/v2/chains"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent hover:underline"
        >
          DefiLlama
        </a>
        , and adds a curated seed list of non-EVM L1s (Solana, Sui, Aptos, Near, TON, Tron,
        Stacks) that neither RPC registry covers.{' '}
        <span className="font-medium text-text">
          {summary.mergedCount.toLocaleString()} EVM chains
        </span>{' '}
        tracked — {summary.inBoth.toLocaleString()} in both registries,{' '}
        {summary.onlyInChainlist.toLocaleString()} only on chainlist.org,{' '}
        {summary.onlyInEthereumLists.toLocaleString()} only on ethereum-lists.
        {typeof summary.nonEvmSeedCount === 'number' && summary.nonEvmSeedCount > 0 && (
          <>
            {' '}
            Plus{' '}
            <span className="font-medium text-text">{summary.nonEvmSeedCount} non-EVM</span>{' '}
            seed chains.
          </>
        )}{' '}
        Sources are community-maintained and can lag reality — always verify with the project
        directly before trusting an endpoint with assets.
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          Data source:{' '}
          <a
            href="https://chainid.network/chains.json"
            target="_blank"
            rel="noreferrer"
            className="text-text hover:text-accent"
          >
            chainid.network
          </a>{' '}
          (ethereum-lists/chains). Updated every hour.
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <a
            href="https://github.com/Heinrich-Kemler/RPCWatch"
            target="_blank"
            rel="noreferrer"
            className="hover:text-text"
          >
            Open source
          </a>
          <span className="font-medium text-critical">
            Built by crypto Goblin &amp; Shai — best frens
          </span>
        </div>
      </div>
    </footer>
  );
}
