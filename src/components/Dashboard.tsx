'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { ProcessedChain } from '../lib/chains';
import { riskPalette, rpcCountPalette } from '../lib/risk';

type FilterKey = 'all' | 'critical' | 'at-risk' | 'safe';

type DashboardProps = {
  chains: ProcessedChain[];
};

const FILTERS: { key: FilterKey; label: string; matches: (chain: ProcessedChain) => boolean }[] = [
  { key: 'all', label: 'All', matches: () => true },
  {
    key: 'critical',
    label: 'Critical (1 RPC)',
    matches: (chain) => chain.publicRpcCount === 1,
  },
  {
    key: 'at-risk',
    label: 'At Risk (2–3)',
    matches: (chain) => chain.publicRpcCount >= 2 && chain.publicRpcCount <= 3,
  },
  {
    key: 'safe',
    label: 'Safe (4+)',
    matches: (chain) => chain.publicRpcCount >= 4,
  },
];

function formatRpcLabel(count: number): string {
  if (count === 0) return '0 public RPCs';
  if (count === 1) return '1 RPC';
  return `${count} RPCs`;
}

function tabCount(chains: ProcessedChain[], key: FilterKey): number {
  const filter = FILTERS.find((entry) => entry.key === key);
  return filter ? chains.filter(filter.matches).length : 0;
}

export default function Dashboard({ chains }: DashboardProps) {
  const [filter, setFilter] = useState<FilterKey>('critical');
  const [query, setQuery] = useState('');
  const [showTestnets, setShowTestnets] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const visibleUniverse = useMemo(
    () =>
      chains.filter((chain) => {
        if (chain.isDeprecated) return false;
        if (!showTestnets && chain.isTestnet) return false;
        return true;
      }),
    [chains, showTestnets],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matcher = FILTERS.find((entry) => entry.key === filter)?.matches ?? (() => true);

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
        if (left.isNotable !== right.isNotable) {
          return left.isNotable ? -1 : 1;
        }
        if (left.publicRpcCount !== right.publicRpcCount) {
          return left.publicRpcCount - right.publicRpcCount;
        }
        return left.name.localeCompare(right.name);
      });
  }, [visibleUniverse, filter, query]);

  const criticalChains = useMemo(
    () => visibleUniverse.filter((chain) => chain.publicRpcCount === 1),
    [visibleUniverse],
  );

  const stats = useMemo(() => {
    const total = visibleUniverse.length;
    const critical = visibleUniverse.filter((chain) => chain.publicRpcCount === 1).length;
    const atRisk = visibleUniverse.filter(
      (chain) => chain.publicRpcCount >= 2 && chain.publicRpcCount <= 3,
    ).length;
    const safe = visibleUniverse.filter((chain) => chain.publicRpcCount >= 4).length;
    const noData = visibleUniverse.filter((chain) => chain.publicRpcCount === 0).length;
    return { total, critical, atRisk, safe, noData };
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

        <SearchAndFilters
          filter={filter}
          setFilter={setFilter}
          query={query}
          setQuery={setQuery}
          showTestnets={showTestnets}
          setShowTestnets={setShowTestnets}
          universe={visibleUniverse}
        />

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
      <div className="mb-8 flex items-center gap-3">
        <div className="relative h-3 w-3 rounded-full bg-critical pulse-critical" />
        <span className="text-xs uppercase tracking-[0.2em] text-muted">RPC Watch</span>
      </div>

      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">RPC Watch</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Which blockchains are one outage away from going dark?
      </p>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Chains monitored" value={stats.total} tone="muted" />
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
  tone: 'critical' | 'warning' | 'safe' | 'muted';
}) {
  const toneClass =
    tone === 'critical'
      ? 'text-critical'
      : tone === 'warning'
      ? 'text-warning'
      : tone === 'safe'
      ? 'text-safe'
      : 'text-text';

  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-6 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
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
  universe,
}: {
  filter: FilterKey;
  setFilter: (key: FilterKey) => void;
  query: string;
  setQuery: (value: string) => void;
  showTestnets: boolean;
  setShowTestnets: (value: boolean) => void;
  universe: ProcessedChain[];
}) {
  return (
    <section className="sticky top-0 z-10 -mx-6 mb-6 bg-bg/80 px-6 pb-4 pt-2 backdrop-blur">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, chain ID, or RPC URL…"
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted focus:border-critical focus:outline-none focus:ring-2 focus:ring-critical/40"
          />
        </div>

        <label className="flex shrink-0 items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showTestnets}
            onChange={(event) => setShowTestnets(event.target.checked)}
            className="h-4 w-4 rounded border-border bg-bg accent-critical"
          />
          Include testnets
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((entry) => {
          const count = tabCount(universe, entry.key);
          const active = filter === entry.key;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={() => setFilter(entry.key)}
              className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                active
                  ? entry.key === 'critical'
                    ? 'border-critical/40 bg-critical/15 text-critical'
                    : entry.key === 'at-risk'
                    ? 'border-warning/40 bg-warning/15 text-warning'
                    : entry.key === 'safe'
                    ? 'border-safe/40 bg-safe/15 text-safe'
                    : 'border-border bg-card text-text'
                  : 'border-border bg-card text-muted hover:text-text'
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
    <section className="mb-8 rounded-2xl border border-critical/40 bg-gradient-to-b from-critical/10 to-transparent p-6 shadow-[0_0_40px_rgba(239,68,68,0.12)]">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-2 w-2 rounded-full bg-critical pulse-critical" />
        <div>
          <h2 className="text-xl font-semibold text-critical">
            Critical: Single RPC Chains
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            These chains have exactly one public RPC endpoint. If it goes offline, the chain
            effectively becomes unreachable for most users — wallets, dApps, and bridges all depend
            on the same endpoint.{' '}
            <span className="text-text">{totalCritical.toLocaleString()}</span> chains in total.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chains.map((chain) => (
          <Link
            key={chain.chainId}
            href={`/chain/${chain.chainId}`}
            className="group rounded-xl border border-critical/30 bg-card/80 p-4 transition hover:border-critical hover:bg-card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text group-hover:text-critical">
                  {chain.name}
                </span>
                {chain.isNotable && (
                  <span className="rounded-full bg-critical/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-critical">
                    Notable
                  </span>
                )}
              </div>
              <span className="text-xs text-muted">#{chain.chainId}</span>
            </div>
            <div className="mt-3 truncate text-xs text-muted">{chain.publicRpcs[0]}</div>
          </Link>
        ))}
      </div>
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
      <section className="rounded-2xl border border-border bg-card p-10 text-center">
        <div className="text-sm text-muted">No chains match this filter.</div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden grid-cols-[1.8fr_0.6fr_0.7fr_0.9fr_1.5fr_0.6fr] gap-4 border-b border-border px-5 py-3 text-[0.7rem] uppercase tracking-wider text-muted md:grid">
        <div>Chain</div>
        <div>Chain ID</div>
        <div>RPC count</div>
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
  const countStyle = rpcCountPalette(chain.publicRpcCount);
  const explorer = chain.explorers[0];
  const initial = chain.name.charAt(0).toUpperCase();

  return (
    <li className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[1.8fr_0.6fr_0.7fr_0.9fr_1.5fr_0.6fr] md:items-center md:gap-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg text-sm font-semibold ${countStyle.text}`}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <Link
            href={`/chain/${chain.chainId}`}
            className="block truncate font-medium text-text hover:text-critical"
          >
            {chain.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="truncate">{chain.nativeCurrency.symbol}</span>
            {chain.isNotable && (
              <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted">
                Notable
              </span>
            )}
            {chain.isTestnet && (
              <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted">
                Testnet
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center md:block">
        <span className="font-mono text-xs text-muted md:hidden">Chain ID · </span>
        <span className="rounded-md border border-border bg-bg px-2 py-1 font-mono text-xs text-text">
          {chain.chainId}
        </span>
      </div>

      <div>
        <span className={`text-2xl font-semibold ${countStyle.text}`}>
          {chain.publicRpcCount}
        </span>
        <span className="ml-1 text-xs text-muted">{formatRpcLabel(chain.publicRpcCount)}</span>
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
          className="w-max rounded-md border border-border bg-bg px-3 py-1.5 text-xs text-text hover:border-critical hover:text-critical"
        >
          {expanded ? 'Hide RPCs' : `View ${chain.publicRpcCount} RPC${chain.publicRpcCount === 1 ? '' : 's'}`}
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
                className="truncate rounded-md border border-border bg-bg px-2 py-1 font-mono text-muted"
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
            className="inline-flex items-center gap-1 rounded-md border border-border bg-bg px-3 py-1.5 text-xs text-muted hover:border-critical hover:text-critical"
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

function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-card/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          Data source:{' '}
          <a
            href="https://chainid.network/chains.json"
            target="_blank"
            rel="noreferrer"
            className="text-text hover:text-critical"
          >
            chainid.network
          </a>{' '}
          (ethereum-lists/chains). Updated every hour.
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/ethereum-lists/chains"
            target="_blank"
            rel="noreferrer"
            className="hover:text-text"
          >
            Open source
          </a>
          <span className="text-text">Built by Weaving Web 3</span>
        </div>
      </div>
    </footer>
  );
}
