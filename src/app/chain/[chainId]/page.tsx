import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import CopyButton from '../../../components/CopyButton';
import ShareButtons from '../../../components/ShareButtons';
import type { ProcessedChain, ProviderGroup, RpcEndpoint } from '../../../lib/chains';
import { SIGNIFICANT_TVL_USD } from '../../../lib/chains';
import { getCachedChainById } from '../../../lib/chains.server';
import { describeTracking, formatCompactUsd, safeExternalHref } from '../../../lib/format';
import { riskPalette, rpcCountPalette } from '../../../lib/risk';

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ chainId: string }>;
};

async function resolveChain(params: PageProps['params']): Promise<ProcessedChain | undefined> {
  const { chainId } = await params;
  const parsed = Number.parseInt(chainId, 10);
  if (!Number.isFinite(parsed)) return undefined;
  return getCachedChainById(parsed);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const chain = await resolveChain(params);
  if (!chain) {
    return { title: 'Chain not found — RPC Watch' };
  }
  const providerLabel =
    chain.distinctProviders === 0
      ? 'no public providers'
      : chain.distinctProviders === 1
      ? '1 provider'
      : `${chain.distinctProviders} providers`;
  return {
    title: `${chain.name} (${chain.isNonEvm ? chain.arch : chain.chainId}) — RPC Watch`,
    description: `${chain.name} runs on ${providerLabel} across ${chain.publicRpcCount} public RPC endpoint${chain.publicRpcCount === 1 ? '' : 's'}.`,
  };
}

export default async function ChainDetailPage({ params }: PageProps) {
  const chain = await resolveChain(params);
  if (!chain) {
    notFound();
  }

  const risk = riskPalette(chain.riskLevel);
  const countStyle = rpcCountPalette(chain.distinctProviders);
  const soleProvider =
    chain.distinctProviders === 1 && chain.publicRpcCount >= 1 ? chain.providerGroups[0] : null;
  const tvlSourceLabel =
    chain.tvlSource === 'defillama'
      ? 'Source: DefiLlama'
      : chain.tvlSource === 'chainlist'
      ? 'Source: chainlist.org'
      : null;

  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/" className="hover:text-text">
            ← Back to all chains
          </Link>
        </nav>

        <header className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 font-mono">
                  {chain.isNonEvm ? chain.arch.toUpperCase() : `Chain ID ${chain.chainId}`}
                </span>
                <span className="rounded-full border border-border bg-surface px-2.5 py-1">
                  {chain.nativeCurrency.symbol} · {chain.nativeCurrency.name}
                </span>
                {chain.isNotable && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold uppercase tracking-wider text-accent">
                    Notable
                  </span>
                )}
                {chain.isTestnet && (
                  <span className="rounded-full border border-border bg-surface px-2.5 py-1 uppercase tracking-wider">
                    Testnet
                  </span>
                )}
                {chain.isNonEvm && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold uppercase tracking-wider text-amber-700">
                    Non-EVM
                  </span>
                )}
                {chain.tvlUsd !== null && chain.tvlUsd >= SIGNIFICANT_TVL_USD && (
                  <span
                    className="rounded-full bg-green-50 px-2.5 py-1 font-semibold uppercase tracking-wider text-safe"
                    title={tvlSourceLabel ?? ''}
                  >
                    TVL {formatCompactUsd(chain.tvlUsd)}
                  </span>
                )}
                <span
                  className="rounded-full border border-border bg-surface px-2.5 py-1 uppercase tracking-wider"
                  title={`Data from: ${chain.sources.join(' + ')}`}
                >
                  {chain.sources.length >= 2 ? `${chain.sources.length} sources` : chain.sources[0]}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{chain.name}</h1>
              <div className="mt-2 text-sm text-muted">{chain.chain}</div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${risk.badge}`}
              >
                <span className={`h-2 w-2 rounded-full ${risk.dot}`} />
                {risk.label}
              </div>
              <div className={`text-right text-4xl font-bold ${countStyle.text}`}>
                {chain.distinctProviders}
                <span className="ml-2 text-sm font-medium text-muted">
                  provider{chain.distinctProviders === 1 ? '' : 's'}
                </span>
              </div>
              <div className="text-right text-xs text-muted">
                across {chain.publicRpcCount} public URL{chain.publicRpcCount === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          <WhyThisMatters chain={chain} soleProvider={soleProvider} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(() => {
              const safeInfo = safeExternalHref(chain.infoURL);
              return safeInfo ? (
                <a
                  href={safeInfo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-accent/20 bg-blue-50 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-blue-100"
                >
                  Visit project website
                  <span aria-hidden>↗</span>
                </a>
              ) : null;
            })()}
            <ShareButtons
              chainName={chain.name}
              publicRpcCount={chain.publicRpcCount}
              path={`/chain/${chain.chainId}`}
            />
          </div>
        </header>

        <KnowBetter chain={chain} />

        <DependencyBlock chain={chain} />

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Endpoints grouped by provider
          </h2>
          <p className="mt-1 text-xs text-muted">
            URLs are grouped by the operator we identify them with. Multiple URLs under the same
            provider represent the same operator — redundancy only counts at the provider level.
            {chain.templateRpcs.length > 0 && (
              <>
                {' '}
                Hidden: {chain.templateRpcs.length} API-key endpoint
                {chain.templateRpcs.length === 1 ? '' : 's'}.
              </>
            )}
          </p>

          <div className="mt-4 space-y-4">
            {chain.providerGroups.map((group) => (
              <ProviderCard key={group.id} group={group} details={chain.publicRpcDetails} />
            ))}
            {chain.providerGroups.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
                No public RPC endpoints listed.
              </div>
            )}
          </div>
        </section>

        {chain.explorers.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Explorers</h2>
            <ul className="mt-4 space-y-2">
              {chain.explorers.map((explorer) => {
                const safe = safeExternalHref(explorer.url);
                return (
                  <li
                    key={explorer.url}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-text">{explorer.name ?? explorer.url}</div>
                      <div className="truncate text-xs text-muted">{explorer.url}</div>
                    </div>
                    {safe ? (
                      <a
                        href={safe}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-border bg-card px-3 py-1 text-xs text-muted shadow-sm transition hover:border-accent hover:text-accent"
                      >
                        Open ↗
                      </a>
                    ) : (
                      <span className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted">
                        Link withheld
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-xs text-muted">
          <strong className="text-text">Disclaimer.</strong> RPC Watch merges{' '}
          <a
            href="https://chainlist.org/rpcs.json"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            chainlist.org
          </a>
          ,{' '}
          <a
            href="https://chainid.network/chains.json"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            chainid.network
          </a>
          , and{' '}
          <a
            href="https://api.llama.fi/v2/chains"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            DefiLlama
          </a>
          . Non-EVM chains come from a curated seed list. Sources are community-maintained and can
          lag reality — always verify with the project directly before trusting an endpoint with
          assets.
        </section>

        <section className="mt-4 text-xs text-muted">
          <span className="font-medium text-critical">
            Built by crypto Goblin &amp; Shai — best frens
          </span>
        </section>
      </div>
    </main>
  );
}

function KnowBetter({ chain }: { chain: ProcessedChain }) {
  if (chain.riskLevel !== 'critical' && chain.riskLevel !== 'at-risk') return null;

  const evmPrFlow = !chain.isNonEvm;
  const nonEvmPrFlow = chain.isNonEvm;

  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm">
      <div className="font-semibold text-amber-900">Know of more public RPCs for this chain?</div>
      <p className="mt-1 text-amber-900/85">
        This page reflects what the community registries currently list — nothing more. If you
        know of a working public endpoint that isn&apos;t here, please add it upstream so every
        tool (not just RPC Watch) gets the fix.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-amber-900/85">
        {evmPrFlow && (
          <li>
            Open a PR to{' '}
            <a
              href="https://github.com/ethereum-lists/chains"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-amber-900 underline hover:text-critical"
            >
              ethereum-lists/chains
            </a>{' '}
            (the source behind chainid.network) and{' '}
            <a
              href="https://github.com/DefiLlama/chainlist"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-amber-900 underline hover:text-critical"
            >
              DefiLlama/chainlist
            </a>{' '}
            (the source behind chainlist.org).
          </li>
        )}
        {nonEvmPrFlow && (
          <li>
            Non-EVM chains are hand-seeded in{' '}
            <a
              href="https://github.com/Heinrich-Kemler/RPCWatch/blob/main/src/lib/nonEvmChains.ts"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-amber-900 underline hover:text-critical"
            >
              src/lib/nonEvmChains.ts
            </a>{' '}
            — add the endpoint and the operator name after verifying anonymous access.
          </li>
        )}
        <li>
          Our{' '}
          <a
            href="https://github.com/Heinrich-Kemler/RPCWatch/blob/main/src/lib/providers.ts"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-amber-900 underline hover:text-critical"
          >
            hostname → provider map
          </a>{' '}
          decides when two URLs count as the same operator. Missing mappings are tagged
          &ldquo;Apex&rdquo; — if one looks wrong, open a PR.
        </li>
      </ul>
    </section>
  );
}

function WhyThisMatters({
  chain,
  soleProvider,
}: {
  chain: ProcessedChain;
  soleProvider: ProviderGroup | null;
}) {
  if (chain.riskLevel === 'critical' && soleProvider) {
    const multiUrl = chain.publicRpcCount >= 2;
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
        <div className="font-semibold text-critical">Why this matters</div>
        <p className="mt-1 text-muted">
          Every public RPC for this chain resolves to{' '}
          <span className="font-semibold text-text">{soleProvider.name}</span>
          {multiUrl ? (
            <>
              {' '}
              — all {chain.publicRpcCount} URLs are different entry points into the same operator.
              If {soleProvider.name} goes down, the chain goes dark for every wallet and dApp.
            </>
          ) : (
            <>
              . A single outage and the chain goes dark for every wallet and dApp. A compromise
              lets the attacker feed every user the same fabricated view of the chain.
            </>
          )}
        </p>
      </div>
    );
  }

  if (chain.riskLevel === 'at-risk') {
    return (
      <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
        <div className="font-semibold text-warning">Thin redundancy</div>
        <p className="mt-1 text-muted">
          This chain is served by only{' '}
          <span className="font-semibold text-text">{chain.distinctProviders}</span> distinct
          providers. Losing one leaves the rest under load — losing two or three is effectively an
          outage.
        </p>
      </div>
    );
  }

  if (chain.riskLevel === 'no-data') {
    return (
      <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        No public RPC endpoints are listed for this chain in our sources. Any listed RPCs require
        an API key and aren&apos;t usable by an anonymous client.
      </div>
    );
  }

  return null;
}

function DependencyBlock({ chain }: { chain: ProcessedChain }) {
  if (chain.publicRpcCount === 0) return null;

  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Distinct providers"
        value={chain.distinctProviders.toString()}
        tone={
          chain.distinctProviders === 0
            ? 'muted'
            : chain.distinctProviders === 1
            ? 'critical'
            : chain.distinctProviders <= 3
            ? 'warning'
            : 'safe'
        }
        hint={chain.distinctProviders === 1 ? 'Single point of failure' : 'Operator-level redundancy'}
      />
      <StatCard
        label="Public URLs"
        value={chain.publicRpcCount.toString()}
        tone="neutral"
        hint={`${chain.templateRpcs.length} more require API keys`}
      />
      <StatCard
        label="TVL"
        value={chain.tvlUsd !== null ? formatCompactUsd(chain.tvlUsd) : '—'}
        tone={chain.tvlUsd !== null && chain.tvlUsd >= SIGNIFICANT_TVL_USD ? 'safe' : 'neutral'}
        hint={
          chain.tvlSource === 'defillama'
            ? 'From DefiLlama'
            : chain.tvlSource === 'chainlist'
            ? 'From chainlist.org'
            : 'Not reported'
        }
      />
    </section>
  );
}

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: 'critical' | 'warning' | 'safe' | 'muted' | 'neutral';
  hint?: string;
}) {
  const toneClass =
    tone === 'critical'
      ? 'text-critical'
      : tone === 'warning'
      ? 'text-warning'
      : tone === 'safe'
      ? 'text-safe'
      : tone === 'muted'
      ? 'text-muted'
      : 'text-text';
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-card">
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

function ProviderCard({ group, details }: { group: ProviderGroup; details: RpcEndpoint[] }) {
  const groupEndpoints = details.filter((entry) => entry.providerId === group.id);
  const verifiedStyle = group.verified
    ? 'border-blue-200 bg-blue-50 text-accent'
    : 'border-border bg-surface text-muted';

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider ${verifiedStyle}`}
            title={group.verified ? 'Operator identified via hostname map' : 'Operator inferred from apex hostname'}
          >
            {group.verified ? 'Provider' : 'Apex'}
          </span>
          <Link
            href={`/provider/${encodeURIComponent(group.id)}`}
            className="text-sm font-semibold text-text hover:text-accent hover:underline"
          >
            {group.name}
          </Link>
          <span className="text-xs text-muted">
            · {group.urls.length} URL{group.urls.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {groupEndpoints.map((endpoint) => (
          <EndpointRow key={endpoint.url} endpoint={endpoint} />
        ))}
      </ul>
    </div>
  );
}

function EndpointRow({ endpoint }: { endpoint: RpcEndpoint }) {
  const tracking = describeTracking(endpoint.tracking);
  const trackingTone =
    tracking.tone === 'safe'
      ? 'bg-green-50 text-safe'
      : tracking.tone === 'caution'
      ? 'bg-yellow-50 text-caution'
      : tracking.tone === 'warning'
      ? 'bg-red-50 text-critical'
      : 'border border-border bg-card text-muted';

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-muted">
            {endpoint.kind}
          </span>
          <code className="truncate font-mono text-xs text-text" title={endpoint.url}>
            {endpoint.url}
          </code>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[0.6rem] uppercase tracking-wider">
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${trackingTone}`}
            title={tracking.description}
          >
            {tracking.label}
          </span>
          {endpoint.isOpenSource === true && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-accent">
              Open source
            </span>
          )}
          {endpoint.isOpenSource === false && (
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-semibold text-muted">
              Closed source
            </span>
          )}
          {endpoint.sources.length > 0 && (
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-muted">
              {endpoint.sources.length === 2 ? '2 sources' : endpoint.sources[0]}
            </span>
          )}
        </div>
      </div>
      <CopyButton value={endpoint.url} label="Copy URL" />
    </li>
  );
}
