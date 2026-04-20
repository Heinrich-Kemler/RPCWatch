import Link from 'next/link';

export default function ChainNotFound() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
        <div className="text-xs uppercase tracking-[0.2em] text-muted">RPC Watch</div>
        <h1 className="mt-4 text-3xl font-bold">Chain not found</h1>
        <p className="mt-2 text-sm text-muted">
          We couldn&apos;t find that chain ID in the chainid.network dataset.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-text hover:border-critical hover:text-critical"
          >
            ← Back to all chains
          </Link>
        </div>
      </div>
    </main>
  );
}
