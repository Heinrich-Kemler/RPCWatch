import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import CopyButton from '../../../components/CopyButton';
import ShareButtons from '../../../components/ShareButtons';
import type { ProcessedChain, RpcEndpoint } from '../../../lib/chains';
import { SIGNIFICANT_TVL_USD } from '../../../lib/chains';
import { getCachedChainById } from '../../../lib/chains.server';
import { describeTracking, formatCompactUsd } from '../../../lib/format';
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
  const countLabel =
    chain.publicRpcCount === 0
      ? 'no public RPCs'
      : `${chain.publicRpcCount} public RPC${chain.publicRpcCount === 1 ? '' : 's'}`;
  return {
    title: `${chain.name} (${chain.chainId}) — RPC Watch`,
    description: `${chain.name} currently has ${countLabel} on chainlist. Track endpoint risk on RPC Watch.`,
  };
}

export default async function ChainDetailPage({ params }: PageProps) {
  const chain = await resolveChain(params);
  if (!chain) {
    notFound();
  }

  const risk = riskPalette(chain.riskLevel);
  const countStyle = rpcCountPalette(chain.publicRpcCount);
  const httpPublic = chain.publicRpcDetails.filter((entry) => entry.kind === 'http');
  const wssPublic = chain.publicRpcDetails.filter((entry) => entry.kind === 'wss');
  const otherPublic = chain.publicRpcDetails.filter((entry) => entry.kind === 'other');

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
                  Chain ID {chain.chainId}
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
                {chain.tvlUsd !== null && chain.tvlUsd >= SIGNIFICANT_TVL_USD && (
                  <span
                    className="rounded-full bg-green-50 px-2.5 py-1 font-semibold uppercase tracking-wider text-safe"
                    title="TVL reported by chainlist.org (via DefiLlama)"
                  >
                    TVL {formatCompactUsd(chain.tvlUsd)}
                  </span>
                )}
                <span
                  className="rounded-full border border-border bg-surface px-2.5 py-1 uppercase tracking-wider"
                  title={`Tracked by: ${chain.sources.join(' + ')}`}
                >
                  {chain.sources.length === 2 ? '2 sources' : chain.sources[0]}
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
              <div className={`text-4xl font-bold ${countStyle.text}`}>
                {chain.publicRpcCount}
                <span className="ml-2 text-sm font-medium text-muted">
                  public RPC{chain.publicRpcCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          {chain.riskLevel === 'critical' && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm">
              <div className="font-semibold text-critical">Why this matters</div>
              <p className="mt-1 text-muted">
                This chain currently has only 1 public RPC endpoint. All wallets, dApps, and users
                relying on this chain use the same endpoint. A single outage makes this chain
                unreachable — and a compromise lets an attacker feed every user the same wrong
                view of the chain.
              </p>
            </div>
          )}

          {chain.riskLevel === 'no-data' && (
            <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm text-muted">
              No public RPC endpoints are listed on chainlist for this chain. Any listed RPCs
              require API keys.
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {chain.infoURL && (
              <a
                href={chain.infoURL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-accent/20 bg-blue-50 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-blue-100"
              >
                Visit project website
                <span aria-hidden>↗</span>
              </a>
            )}
            <ShareButtons
              chainName={chain.name}
              publicRpcCount={chain.publicRpcCount}
              path={`/chain/${chain.chainId}`}
            />
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Public RPC endpoints
          </h2>
          <p className="mt-1 text-xs text-muted">
            Endpoints with <code className="text-text">{'${VARIABLE}'}</code> placeholders are
            excluded — they require API keys and do not count as public RPCs.
            {chain.templateRpcs.length > 0 && (
              <>
                {' '}
                Hidden: {chain.templateRpcs.length} API-key endpoint
                {chain.templateRpcs.length === 1 ? '' : 's'}.
              </>
            )}
          </p>

          <div className="mt-4 space-y-6">
            <RpcGroup label="HTTP" endpoints={httpPublic} />
            <RpcGroup label="WebSocket" endpoints={wssPublic} />
            {otherPublic.length > 0 && <RpcGroup label="Other" endpoints={otherPublic} />}
            {chain.publicRpcs.length === 0 && (
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
              {chain.explorers.map((explorer) => (
                <li
                  key={explorer.url}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate text-text">{explorer.name ?? explorer.url}</div>
                    <div className="truncate text-xs text-muted">{explorer.url}</div>
                  </div>
                  <a
                    href={explorer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border bg-card px-3 py-1 text-xs text-muted shadow-sm transition hover:border-accent hover:text-accent"
                  >
                    Open ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 text-xs text-muted">
          <strong className="text-text">Disclaimer.</strong> RPC Watch merges two community
          registries:{' '}
          <a
            href="https://chainlist.org/rpcs.json"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            chainlist.org
          </a>{' '}
          (per-RPC privacy &amp; open-source flags, TVL via DefiLlama) and{' '}
          <a
            href="https://chainid.network/chains.json"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            chainid.network
          </a>{' '}
          (the{' '}
          <a
            href="https://github.com/ethereum-lists/chains"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent hover:underline"
          >
            ethereum-lists/chains
          </a>{' '}
          registry). Endpoints appear here if either source lists them. Both are
          community-maintained and can be out of date — always verify with the project
          directly before trusting an endpoint with assets.
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

function RpcGroup({ label, endpoints }: { label: string; endpoints: RpcEndpoint[] }) {
  if (endpoints.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span>{endpoints.length}</span>
      </div>
      <ul className="mt-2 space-y-2">
        {endpoints.map((endpoint) => {
          const tracking = describeTracking(endpoint.tracking);
          const toneClass =
            tracking.tone === 'safe'
              ? 'bg-green-50 text-safe'
              : tracking.tone === 'caution'
              ? 'bg-yellow-50 text-caution'
              : tracking.tone === 'warning'
              ? 'bg-red-50 text-critical'
              : 'border border-border bg-card text-muted';
          return (
            <li
              key={endpoint.url}
              className="flex flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 rounded-md border border-border bg-card px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-muted">
                    {label}
                  </span>
                  <code className="truncate font-mono text-xs text-text" title={endpoint.url}>
                    {endpoint.url}
                  </code>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-wider">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${toneClass}`}
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
                    <span className="rounded-full border border-border bg-card px-2 py-0.5 font-semibold text-muted">
                      Closed source
                    </span>
                  )}
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-muted">
                    {endpoint.sources.length === 2 ? '2 sources' : endpoint.sources[0]}
                  </span>
                </div>
              </div>
              <CopyButton value={endpoint.url} label="Copy URL" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
