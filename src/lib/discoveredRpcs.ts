/**
 * RPC Watch-discovered endpoints.
 *
 * Endpoints we found by direct probing that neither chainlist.org nor
 * ethereum-lists/chains list yet. Each one:
 *   - was verified to respond anonymously (no API key, no sign-up)
 *   - returned the expected chainId via eth_chainId
 *   - is recorded with the date we last saw it working
 *
 * These are merged into the processed chain data as a third source
 * alongside the two registries, so we don't lose them if the upstream
 * registries don't get corresponding PRs. Every entry here should have
 * a date so stale entries can be re-verified by the weekly verification
 * job (Tier 1 of the roadmap).
 *
 * To add a new entry:
 *   1. Probe with: curl -X POST <url> -H 'content-type: application/json'
 *      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
 *   2. Confirm the result is the expected chainId in hex
 *   3. Add below with today's date
 *
 * When an entry fails verification, REMOVE it rather than leaving stale
 * data — this file is the evidence log that backs our "verified" claim.
 */

export type DiscoveredRpc = {
  chainId: number;
  url: string;
  /** ISO-8601 date (YYYY-MM-DD) of the most recent successful probe. */
  verifiedAt: string;
  /** Optional free-form note, e.g. source of discovery or flakiness. */
  note?: string;
};

export const DISCOVERED_RPCS: DiscoveredRpc[] = [
  // Stable Mainnet — Tenderly Gateway serves it even though chainlist doesn't list it.
  {
    chainId: 988,
    url: 'https://stable.gateway.tenderly.co',
    verifiedAt: '2026-04-21',
  },

  // Morph — dRPC serves anonymously.
  {
    chainId: 2818,
    url: 'https://morph.drpc.org',
    verifiedAt: '2026-04-21',
  },

  // Tempo Mainnet — big uplift. Registry only had dRPC; we confirmed 4 operators.
  {
    chainId: 4217,
    url: 'https://tempo-rpc.publicnode.com',
    verifiedAt: '2026-04-21',
  },
  {
    chainId: 4217,
    url: 'https://1rpc.io/tempo',
    verifiedAt: '2026-04-21',
  },
  {
    chainId: 4217,
    url: 'https://tempo.gateway.tenderly.co',
    verifiedAt: '2026-04-21',
  },

  // Nibiru cataclysm-1 — PublicNode runs an anonymous endpoint.
  {
    chainId: 6900,
    url: 'https://nibiru.publicnode.com',
    verifiedAt: '2026-04-21',
  },

  // 0G Mainnet — dRPC + PublicNode both run anonymous endpoints.
  {
    chainId: 16661,
    url: 'https://0g.drpc.org',
    verifiedAt: '2026-04-21',
  },
  {
    chainId: 16661,
    url: 'https://0g-rpc.publicnode.com',
    verifiedAt: '2026-04-21',
  },
];

export function discoveredRpcsForChain(chainId: number): DiscoveredRpc[] {
  return DISCOVERED_RPCS.filter((entry) => entry.chainId === chainId);
}
