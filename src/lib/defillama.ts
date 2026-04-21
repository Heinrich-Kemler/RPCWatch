/**
 * DefiLlama /v2/chains adapter.
 *
 * Endpoint: https://api.llama.fi/v2/chains
 * Shape:    Array<{ gecko_id, tvl, tokenSymbol, cmcId, name, chainId }>
 *
 * We use this as the primary TVL source because:
 *   - it is the upstream DefiLlama feed (chainlist.org re-exports only a subset)
 *   - it covers ~440 chains, including non-EVM (Solana, Sui, Aptos, Near, Tron, …)
 *   - it is open, no auth, no key
 *
 * We join on `chainId` where present. Non-EVM chains in DefiLlama may
 * have a `chainId` that is either a numeric ID or absent — we also
 * expose the raw entries by normalized name so callers can fall back.
 *
 * NOTE: DefiLlama's /hacks endpoint is paid (HTTP 402) as of April 2026.
 * If a free incident feed becomes available, add the adapter here.
 */

export type DefiLlamaChainEntry = {
  geckoId: string | null;
  tvl: number | null;
  tokenSymbol: string | null;
  cmcId: string | null;
  name: string;
  chainId: number | string | null;
};

export type DefiLlamaIndex = {
  byChainId: Map<number, DefiLlamaChainEntry>;
  byNormalizedName: Map<string, DefiLlamaChainEntry>;
  fetchedAt: string;
};

export const DEFILLAMA_CHAINS_URL = 'https://api.llama.fi/v2/chains';

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+mainnet$/i, '').replace(/\s+network$/i, '');
}

function toNumberChainId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function fetchDefiLlamaChains(): Promise<DefiLlamaIndex> {
  const response = await fetch(DEFILLAMA_CHAINS_URL, {
    headers: {
      accept: 'application/json',
      'user-agent': 'RPCWatch/1.0 (+https://rpc-watch.vercel.app)',
    },
  });
  if (!response.ok) {
    throw new Error(`DefiLlama fetch failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error('Expected DefiLlama /v2/chains to return an array.');
  }

  const byChainId = new Map<number, DefiLlamaChainEntry>();
  const byNormalizedName = new Map<string, DefiLlamaChainEntry>();

  for (const raw of payload as Array<Record<string, unknown>>) {
    const chainId = toNumberChainId(raw.chainId);
    const nameRaw = typeof raw.name === 'string' ? raw.name : null;
    if (!nameRaw) continue;

    const entry: DefiLlamaChainEntry = {
      geckoId: typeof raw.gecko_id === 'string' ? raw.gecko_id : null,
      tvl: typeof raw.tvl === 'number' && Number.isFinite(raw.tvl) ? raw.tvl : null,
      tokenSymbol: typeof raw.tokenSymbol === 'string' ? raw.tokenSymbol : null,
      cmcId: typeof raw.cmcId === 'string' ? raw.cmcId : null,
      name: nameRaw,
      chainId: chainId ?? (typeof raw.chainId === 'string' ? raw.chainId : null),
    };

    if (chainId !== null) {
      byChainId.set(chainId, entry);
    }
    const normalized = normalizeName(nameRaw);
    if (!byNormalizedName.has(normalized)) {
      byNormalizedName.set(normalized, entry);
    }
  }

  return { byChainId, byNormalizedName, fetchedAt: new Date().toISOString() };
}

export function resolveDefiLlamaTvl(
  index: DefiLlamaIndex,
  chainId: number,
  name: string,
): { tvl: number | null; entry: DefiLlamaChainEntry | null } {
  const byId = index.byChainId.get(chainId);
  if (byId && byId.tvl !== null) return { tvl: byId.tvl, entry: byId };

  const byName = index.byNormalizedName.get(normalizeName(name));
  if (byName && byName.tvl !== null) return { tvl: byName.tvl, entry: byName };

  return { tvl: null, entry: byId ?? byName ?? null };
}
