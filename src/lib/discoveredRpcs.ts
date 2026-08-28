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
 * a date so stale entries can be re-verified.
 *
 * Last deep probe: 2026-08-28
 *   - Re-verified the April 2026 set (Nibiru PublicNode went 404; removed)
 *   - Added Pocket Network public portal + aggregator/official gaps
 *   - LayerZero thin-coverage pass: AltLayer on OpenLedger, QuickNode/thirdweb
 *     on Morph/Reya/Flow/Hemi, dRPC on Robinhood, Sophon official alt host
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
  // chainId 1
  {
    chainId: 1,
    url: 'https://1rpc.io/eth',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 1,
    url: 'https://eth-pokt.nodies.app',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 1,
    url: 'https://ethereum.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 1,
    url: 'https://ethereum.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 10
  {
    chainId: 10,
    url: 'https://1rpc.io/op',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 10,
    url: 'https://op-pokt.nodies.app',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 10,
    url: 'https://optimism.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 14
  {
    chainId: 14,
    url: 'https://flare.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 25
  {
    chainId: 25,
    url: 'https://cronos-mainnet.gateway.tatum.io',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 25,
    url: 'https://cronos.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 30
  {
    chainId: 30,
    url: 'https://rootstock-mainnet.gateway.tatum.io',
    verifiedAt: '2026-08-28',
  },
  // chainId 56
  {
    chainId: 56,
    url: 'https://1rpc.io/bnb',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 56,
    url: 'https://bsc.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 100
  {
    chainId: 100,
    url: 'https://1rpc.io/gnosis',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 100,
    url: 'https://gnosis-mainnet.gateway.tatum.io',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 100,
    url: 'https://gnosis.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 100,
    url: 'https://gnosis.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 100,
    url: 'https://xdai.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 130
  {
    chainId: 130,
    url: 'https://1rpc.io/unichain',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  {
    chainId: 130,
    url: 'https://unichain.api.pocket.network',
    verifiedAt: '2026-08-28',
    note: 'Pocket Network public portal — keyless as of 2026-08',
  },
  {
    chainId: 130,
    url: 'https://unichain.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  {
    chainId: 130,
    url: 'https://unichain.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 137
  {
    chainId: 137,
    url: 'https://1rpc.io/matic',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 137,
    url: 'https://matic.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 137,
    url: 'https://polygon.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 143
  {
    chainId: 143,
    url: 'https://monad.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  {
    chainId: 143,
    url: 'https://monad.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  // chainId 146
  {
    chainId: 146,
    url: 'https://1rpc.io/sonic',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 146,
    url: 'https://sonic.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 169
  {
    chainId: 169,
    url: 'https://1rpc.io/manta',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 196
  {
    chainId: 196,
    url: 'https://xlayer-mainnet.gateway.tatum.io',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 204
  {
    chainId: 204,
    url: 'https://1rpc.io/opbnb',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 204,
    url: 'https://opbnb.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 239
  {
    chainId: 239,
    url: 'https://tac.drpc.org',
    verifiedAt: '2026-08-28',
  },
  // chainId 250
  {
    chainId: 250,
    url: 'https://1rpc.io/ftm',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 324
  {
    chainId: 324,
    url: 'https://zksync-era.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 324,
    url: 'https://zksync.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 369
  {
    chainId: 369,
    url: 'https://pulsechain.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 480
  {
    chainId: 480,
    url: 'https://world.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 988
  {
    chainId: 988,
    url: 'https://stable.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
  },
  // chainId 999
  {
    chainId: 999,
    url: 'https://1rpc.io/hyperliquid',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  {
    chainId: 999,
    url: 'https://hyperevm-mainnet.gateway.tatum.io',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 999,
    url: 'https://hyperliquid.api.pocket.network',
    verifiedAt: '2026-08-28',
    note: 'Pocket Network public portal — keyless as of 2026-08',
  },
  {
    chainId: 999,
    url: 'https://public.1rpc.io/hyperliquid',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  // chainId 1088
  {
    chainId: 1088,
    url: 'https://metis-pokt.nodies.app',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 1088,
    url: 'https://metis.api.pocket.network',
    verifiedAt: '2026-08-28',
    note: 'Pocket Network public portal — keyless as of 2026-08',
  },
  // chainId 1329
  {
    chainId: 1329,
    url: 'https://sei.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 1514
  {
    chainId: 1514,
    url: 'https://mainnet.story-rpc.com',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  {
    chainId: 1514,
    url: 'https://story-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  {
    chainId: 1514,
    url: 'https://story.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 1868
  {
    chainId: 1868,
    url: 'https://soneium-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 1868,
    url: 'https://soneium.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 1868,
    url: 'https://soneium.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 2222
  {
    chainId: 2222,
    url: 'https://kava-pokt.nodies.app',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 2222,
    url: 'https://kava.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 2818
  {
    chainId: 2818,
    url: 'https://morph.drpc.org',
    verifiedAt: '2026-08-28',
  },
  // chainId 4217
  {
    chainId: 4217,
    url: 'https://1rpc.io/tempo',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 4217,
    url: 'https://tempo-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 4217,
    url: 'https://tempo.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  {
    chainId: 4217,
    url: 'https://tempo.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
  },
  // chainId 4326
  {
    chainId: 4326,
    url: 'https://1rpc.io/megaeth',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 4326,
    url: 'https://megaeth.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
  },
  // chainId 4689
  {
    chainId: 4689,
    url: 'https://iotex.api.pocket.network',
    verifiedAt: '2026-08-28',
    note: 'Pocket Network public portal — keyless as of 2026-08',
  },
  // chainId 5000
  {
    chainId: 5000,
    url: 'https://1rpc.io/mantle',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 5000,
    url: 'https://mantle.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 5000,
    url: 'https://mantle.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 8217
  {
    chainId: 8217,
    url: 'https://kaia.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 8217,
    url: 'https://rpc.ankr.com/klaytn',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 8453
  {
    chainId: 8453,
    url: 'https://1rpc.io/base',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 8453,
    url: 'https://base-pokt.nodies.app',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 8453,
    url: 'https://base.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 9745
  {
    chainId: 9745,
    url: 'https://plasma-mainnet.gateway.tatum.io',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 9745,
    url: 'https://plasma.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
  },
  // chainId 16661
  {
    chainId: 16661,
    url: 'https://0g-mainnet.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 16661,
    url: 'https://0g-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 16661,
    url: 'https://0g.drpc.org',
    verifiedAt: '2026-08-28',
  },
  {
    chainId: 16661,
    url: 'https://0g.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 33139
  {
    chainId: 33139,
    url: 'https://apechain.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
  },
  // chainId 34443
  {
    chainId: 34443,
    url: 'https://1rpc.io/mode',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 42161
  {
    chainId: 42161,
    url: 'https://1rpc.io/arb',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 42161,
    url: 'https://arb-pokt.nodies.app',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 42161,
    url: 'https://arb.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 42161,
    url: 'https://arbitrum-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 42161,
    url: 'https://arbitrum.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 42220
  {
    chainId: 42220,
    url: 'https://1rpc.io/celo',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 42220,
    url: 'https://celo-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 42220,
    url: 'https://celo.api.pocket.network',
    verifiedAt: '2026-08-28',
    note: 'Pocket Network public portal — keyless as of 2026-08',
  },
  {
    chainId: 42220,
    url: 'https://celo.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 42220,
    url: 'https://celo.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 42793
  {
    chainId: 42793,
    url: 'https://etherlink.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 43114
  {
    chainId: 43114,
    url: 'https://avalanche-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 43114,
    url: 'https://avalanche.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 43114,
    url: 'https://avalanche.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 57073
  {
    chainId: 57073,
    url: 'https://ink.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Documented public endpoint, missing from both registries',
  },
  // chainId 59144
  {
    chainId: 59144,
    url: 'https://1rpc.io/linea',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 59144,
    url: 'https://linea.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 59144,
    url: 'https://linea.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 80094
  {
    chainId: 80094,
    url: 'https://berachain.gateway.tenderly.co',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 80094,
    url: 'https://berachain.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 81457
  {
    chainId: 81457,
    url: 'https://blast.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 88888
  {
    chainId: 88888,
    url: 'https://chiliz-rpc.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 167000
  {
    chainId: 167000,
    url: 'https://taiko.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 534352
  {
    chainId: 534352,
    url: 'https://1rpc.io/scroll',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  {
    chainId: 534352,
    url: 'https://scroll.publicnode.com',
    verifiedAt: '2026-08-28',
    note: 'Aggregator URL pattern probe, missing from both registries',
  },
  // chainId 810180
  {
    chainId: 810180,
    url: 'https://zklink-nova.api.pocket.network',
    verifiedAt: '2026-08-28',
    note: 'Pocket Network public portal — keyless as of 2026-08',
  },
  // chainId 1440000
  {
    chainId: 1440000,
    url: 'https://xrplevm.api.pocket.network',
    verifiedAt: '2026-08-28',
    note: 'Pocket Network public portal — keyless as of 2026-08; eth_chainId 1440000',
  },
  // LayerZero thin-coverage follow-up (2026-08-28): extra operators
  // confirmed anonymously on familiar / high-TVL omnichain networks.
  {
    chainId: 747,
    url: 'https://747.rpc.thirdweb.com',
    verifiedAt: '2026-08-28',
    note: 'thirdweb public chain-id URL — anonymous eth_chainId 747',
  },
  {
    chainId: 1612,
    url: 'https://openledger-mainnet.alt.technology',
    verifiedAt: '2026-08-28',
    note: 'AltLayer sequencer RPC — second independent operator on OpenLedger',
  },
  {
    chainId: 1729,
    url: 'https://1729.rpc.thirdweb.com',
    verifiedAt: '2026-08-28',
    note: 'thirdweb public chain-id URL — anonymous eth_chainId 1729',
  },
  {
    chainId: 2818,
    url: 'https://rpc-quicknode.morph.network',
    verifiedAt: '2026-08-28',
    note: 'QuickNode-branded Morph public endpoint (distinct from morphl2.io foundation)',
  },
  {
    chainId: 2818,
    url: 'https://2818.rpc.thirdweb.com',
    verifiedAt: '2026-08-28',
    note: 'thirdweb public chain-id URL — anonymous eth_chainId 2818',
  },
  {
    chainId: 4663,
    url: 'https://robinhood.drpc.org',
    verifiedAt: '2026-08-28',
    note: 'dRPC public slug missing from both registries',
  },
  {
    chainId: 43111,
    url: 'https://43111.rpc.thirdweb.com',
    verifiedAt: '2026-08-28',
    note: 'thirdweb public chain-id URL — anonymous eth_chainId 43111',
  },
  {
    chainId: 50104,
    url: 'https://rpc.sophonapi.com',
    verifiedAt: '2026-08-28',
    note: 'Sophon official alternate hostname listed in docs',
  },
];

export function discoveredRpcsForChain(chainId: number): DiscoveredRpc[] {
  return DISCOVERED_RPCS.filter((entry) => entry.chainId === chainId);
}
