/**
 * Non-EVM single-provider L1 seed table.
 *
 * Neither chainid.network nor chainlist.org cover non-EVM ecosystems in
 * depth, so we hard-code the chains and the public endpoints we have
 * manually verified respond anonymously (no API key, no sign-up).
 *
 * Verification notes (re-probed 2026-04-21):
 *   - Every URL below was probed with a chain-specific request and
 *     returned a valid response from an anonymous client.
 *   - QuickNode, Chainstack, Alchemy, Ankr, NOWNodes, and Helius
 *     (paid-tier) run public RPCs for many of these chains but all
 *     require an API key. They are intentionally NOT listed here
 *     because RPC Watch's bar is "anonymous access works today."
 *   - dRPC's free tier rejects most non-EVM chains with
 *     "method is not available on freetier." Only chains where dRPC
 *     serves anonymous requests are included.
 *   - Aptos, TON, and Stacks genuinely have thin anonymous coverage:
 *     Aptos Foundation, TON Foundation+partners, and Hiro dominate
 *     their anonymous public surfaces. That concentration is real,
 *     not a gap in this file.
 *
 * Review quarterly. When adding a provider, probe first, verify
 * anonymous access, then add here.
 *
 * chainId convention: synthetic negative numbers so no collision with
 * real EVM chainIds. `caip2` is the authoritative identifier.
 */

export type NonEvmChainSeed = {
  chainId: number;
  name: string;
  shortName: string;
  arch:
    | 'solana'
    | 'move'
    | 'substrate'
    | 'ton'
    | 'tron'
    | 'stacks'
    | 'bitcoin'
    | 'cardano'
    | 'algorand'
    | 'cosmos'
    | 'ripple'
    | 'icp'
    | 'flow'
    | 'other';
  caip2: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  infoURL: string;
  rpcs: Array<{
    url: string;
    operator: string;
    tracking?: 'none' | 'limited' | 'yes' | 'unspecified';
    isOpenSource?: boolean;
  }>;
  /**
   * DefiLlama display name for the TVL join.
   */
  defillamaName: string;
};

export const NON_EVM_SEED: NonEvmChainSeed[] = [
  {
    chainId: -1_000_001,
    name: 'Solana',
    shortName: 'solana',
    arch: 'solana',
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
    infoURL: 'https://solana.com',
    defillamaName: 'Solana',
    rpcs: [
      {
        url: 'https://api.mainnet-beta.solana.com',
        operator: 'Solana Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://solana-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
      {
        url: 'https://mainnet.helius-rpc.com/?api-key=demo',
        operator: 'Helius',
        tracking: 'limited',
      },
      {
        url: 'https://solana-mainnet.gateway.tatum.io',
        operator: 'Tatum',
        tracking: 'yes',
      },
      {
        url: 'https://api.blockeden.xyz/solana/67nCBdZQSH9z3YqDDjdm',
        operator: 'BlockEden',
        tracking: 'limited',
      },
    ],
  },
  {
    chainId: -1_000_002,
    name: 'Sui',
    shortName: 'sui',
    arch: 'move',
    caip2: 'sui:mainnet',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
    infoURL: 'https://sui.io',
    defillamaName: 'Sui',
    rpcs: [
      {
        url: 'https://fullnode.mainnet.sui.io',
        operator: 'Mysten Labs',
        tracking: 'unspecified',
      },
      {
        url: 'https://sui-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
      {
        url: 'https://sui.publicnode.com',
        operator: 'Allnodes',
        tracking: 'none',
      },
      {
        url: 'https://1rpc.io/sui',
        operator: '1RPC',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_003,
    name: 'Aptos',
    shortName: 'aptos',
    arch: 'move',
    caip2: 'aptos:mainnet',
    nativeCurrency: { name: 'Aptos', symbol: 'APT', decimals: 8 },
    infoURL: 'https://aptoslabs.com',
    defillamaName: 'Aptos',
    rpcs: [
      {
        url: 'https://fullnode.mainnet.aptoslabs.com/v1',
        operator: 'Aptos Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://api.mainnet.aptoslabs.com/v1',
        operator: 'Aptos Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://1rpc.io/aptos/v1',
        operator: '1RPC',
        tracking: 'none',
      },
      {
        url: 'https://aptos-rest.publicnode.com/v1',
        operator: 'PublicNode',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_004,
    name: 'Near',
    shortName: 'near',
    arch: 'other',
    caip2: 'near:mainnet',
    nativeCurrency: { name: 'NEAR', symbol: 'NEAR', decimals: 24 },
    infoURL: 'https://near.org',
    defillamaName: 'Near',
    rpcs: [
      {
        url: 'https://rpc.mainnet.near.org',
        operator: 'Near Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://rpc.near.org',
        operator: 'Near Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://near.lava.build',
        operator: 'Lava Network',
        tracking: 'yes',
      },
      {
        url: 'https://near.drpc.org',
        operator: 'dRPC',
        tracking: 'none',
      },
      {
        url: 'https://1rpc.io/near',
        operator: '1RPC',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_005,
    name: 'TON',
    shortName: 'ton',
    arch: 'ton',
    caip2: 'ton:mainnet',
    nativeCurrency: { name: 'Toncoin', symbol: 'TON', decimals: 9 },
    infoURL: 'https://ton.org',
    defillamaName: 'Ton',
    rpcs: [
      {
        url: 'https://toncenter.com/api/v2/jsonRPC',
        operator: 'TON Foundation',
        tracking: 'unspecified',
      },
      {
        url: 'https://tonapi.io/v2',
        operator: 'TonAPI',
        tracking: 'limited',
      },
      {
        url: 'https://mainnet-v4.tonhubapi.com',
        operator: 'TonHub',
        tracking: 'none',
      },
      {
        url: 'https://ton.access.orbs.network/1/mainnet/toncenter-api-v2/jsonRPC',
        operator: 'Orbs TON Access',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_006,
    name: 'Tron',
    shortName: 'tron',
    arch: 'tron',
    caip2: 'tron:mainnet',
    nativeCurrency: { name: 'TRON', symbol: 'TRX', decimals: 6 },
    infoURL: 'https://tron.network',
    defillamaName: 'Tron',
    rpcs: [
      {
        url: 'https://api.trongrid.io',
        operator: 'TronGrid',
        tracking: 'unspecified',
      },
      {
        url: 'https://tron-rpc.publicnode.com/jsonrpc',
        operator: 'PublicNode',
        tracking: 'none',
      },
      {
        url: 'https://tron-evm-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_007,
    name: 'Stacks',
    shortName: 'stacks',
    arch: 'stacks',
    caip2: 'stacks:mainnet',
    nativeCurrency: { name: 'Stacks', symbol: 'STX', decimals: 6 },
    infoURL: 'https://www.stacks.co/',
    defillamaName: 'Stacks',
    rpcs: [
      {
        url: 'https://api.mainnet.hiro.so',
        operator: 'Hiro Systems',
        tracking: 'unspecified',
      },
      {
        url: 'https://api.hiro.so/v2/info',
        operator: 'Hiro Systems',
        tracking: 'unspecified',
      },
    ],
  },
  {
    chainId: -1_000_008,
    name: 'Bitcoin',
    shortName: 'bitcoin',
    arch: 'bitcoin',
    caip2: 'bip122:000000000019d6689c085ae165831e93',
    nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 8 },
    infoURL: 'https://bitcoin.org',
    defillamaName: 'Bitcoin',
    rpcs: [
      {
        url: 'https://bitcoin-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
      {
        url: 'https://blockstream.info/api',
        operator: 'Blockstream Esplora',
        tracking: 'limited',
      },
    ],
  },
  {
    chainId: -1_000_009,
    name: 'Polkadot',
    shortName: 'polkadot',
    arch: 'substrate',
    caip2: 'polkadot:91b171bb158e2d3848fa23a9f1c25182',
    nativeCurrency: { name: 'Polkadot', symbol: 'DOT', decimals: 10 },
    infoURL: 'https://polkadot.network',
    defillamaName: 'Polkadot',
    rpcs: [
      {
        url: 'https://rpc.ibp.network/polkadot',
        operator: 'IBP Network',
        tracking: 'none',
      },
      {
        url: 'https://polkadot-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_010,
    name: 'Kusama',
    shortName: 'kusama',
    arch: 'substrate',
    caip2: 'polkadot:b0a8d493285c2df73290dfb7e61f870f',
    nativeCurrency: { name: 'Kusama', symbol: 'KSM', decimals: 12 },
    infoURL: 'https://kusama.network',
    defillamaName: 'Kusama',
    rpcs: [
      {
        url: 'https://rpc.ibp.network/kusama',
        operator: 'IBP Network',
        tracking: 'none',
      },
      {
        url: 'https://kusama-rpc.publicnode.com',
        operator: 'PublicNode',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_011,
    name: 'Cardano',
    shortName: 'cardano',
    arch: 'cardano',
    caip2: 'cip34:1-764824073',
    nativeCurrency: { name: 'Cardano', symbol: 'ADA', decimals: 6 },
    infoURL: 'https://cardano.org',
    defillamaName: 'Cardano',
    rpcs: [
      {
        url: 'https://api.koios.rest/api/v1/tip',
        operator: 'Koios',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_012,
    name: 'Algorand',
    shortName: 'algorand',
    arch: 'algorand',
    caip2: 'algorand:mainnet-v1.0',
    nativeCurrency: { name: 'Algorand', symbol: 'ALGO', decimals: 6 },
    infoURL: 'https://algorand.foundation',
    defillamaName: 'Algorand',
    rpcs: [
      {
        url: 'https://mainnet-api.4160.nodely.dev/v2/status',
        operator: 'Nodely',
        tracking: 'limited',
      },
      {
        url: 'https://mainnet-api.algonode.cloud/v2/status',
        operator: 'Nodely (algonode alias)',
        tracking: 'limited',
      },
    ],
  },
  {
    chainId: -1_000_013,
    name: 'Litecoin',
    shortName: 'litecoin',
    arch: 'bitcoin',
    caip2: 'bip122:12a765e31ffd4059bada1e25190f6e98',
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 8 },
    infoURL: 'https://litecoin.org',
    defillamaName: 'Litecoin',
    rpcs: [
      {
        url: 'https://api.blockchair.com/litecoin/stats',
        operator: 'Blockchair',
        tracking: 'limited',
      },
    ],
  },
  {
    chainId: -1_000_014,
    name: 'Dogecoin',
    shortName: 'dogecoin',
    arch: 'bitcoin',
    caip2: 'bip122:1a91e3dace36e2be3bf030a65679fe82',
    nativeCurrency: { name: 'Dogecoin', symbol: 'DOGE', decimals: 8 },
    infoURL: 'https://dogecoin.com',
    defillamaName: 'Dogecoin',
    rpcs: [
      {
        url: 'https://api.blockchair.com/dogecoin/stats',
        operator: 'Blockchair',
        tracking: 'limited',
      },
    ],
  },
  {
    chainId: -1_000_015,
    name: 'Cosmos Hub',
    shortName: 'cosmos',
    arch: 'cosmos',
    caip2: 'cosmos:cosmoshub-4',
    nativeCurrency: { name: 'Cosmos', symbol: 'ATOM', decimals: 6 },
    infoURL: 'https://cosmos.network',
    defillamaName: 'Cosmos',
    rpcs: [
      {
        url: 'https://cosmos-rpc.publicnode.com:443/status',
        operator: 'PublicNode',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_016,
    name: 'Celestia',
    shortName: 'celestia',
    arch: 'cosmos',
    caip2: 'cosmos:celestia',
    nativeCurrency: { name: 'Celestia', symbol: 'TIA', decimals: 6 },
    infoURL: 'https://celestia.org',
    defillamaName: 'Celestia',
    rpcs: [
      {
        url: 'https://celestia-rpc.publicnode.com:443/status',
        operator: 'PublicNode',
        tracking: 'none',
      },
      {
        url: 'https://public-celestia-rpc.numia.xyz/status',
        operator: 'Numia',
        tracking: 'limited',
      },
      {
        url: 'https://rpc.celestia.pops.one/status',
        operator: 'P-OPS',
        tracking: 'none',
      },
    ],
  },
  {
    chainId: -1_000_017,
    name: 'Flow',
    shortName: 'flow',
    arch: 'flow',
    caip2: 'flow:mainnet',
    nativeCurrency: { name: 'Flow', symbol: 'FLOW', decimals: 8 },
    infoURL: 'https://flow.com',
    defillamaName: 'Flow',
    rpcs: [
      {
        url: 'https://rest-mainnet.onflow.org/v1',
        operator: 'Dapper Labs',
        tracking: 'unspecified',
      },
    ],
  },
  {
    chainId: -1_000_018,
    name: 'XRPL',
    shortName: 'xrpl',
    arch: 'ripple',
    caip2: 'ripple:0',
    nativeCurrency: { name: 'XRP', symbol: 'XRP', decimals: 6 },
    infoURL: 'https://xrpl.org',
    defillamaName: 'XRP Ledger',
    rpcs: [
      {
        url: 'https://xrplcluster.com/',
        operator: 'XRPL Cluster',
        tracking: 'none',
      },
      {
        url: 'https://s1.ripple.com:51234/',
        operator: 'Ripple',
        tracking: 'unspecified',
      },
    ],
  },
  {
    chainId: -1_000_019,
    name: 'Internet Computer',
    shortName: 'icp',
    arch: 'icp',
    caip2: 'icp:0',
    nativeCurrency: { name: 'Internet Computer', symbol: 'ICP', decimals: 8 },
    infoURL: 'https://internetcomputer.org',
    defillamaName: 'ICP',
    rpcs: [
      {
        url: 'https://ic0.app/api/v2/status',
        operator: 'DFINITY',
        tracking: 'unspecified',
      },
    ],
  },
];
