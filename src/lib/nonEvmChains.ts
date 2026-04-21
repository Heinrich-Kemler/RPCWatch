/**
 * Non-EVM single-provider L1 seed table.
 *
 * Neither chainid.network nor chainlist.org cover non-EVM ecosystems in
 * detail, yet several household-name L1s run on a single foundation- or
 * company-operated public endpoint. Hard-coding this seed list means
 * they show up in the dashboard at their real risk level instead of
 * being invisible.
 *
 * Review this list roughly once a quarter.
 *
 * chainId convention for non-EVM entries: we use a synthetic negative
 * number so it never collides with real EVM chainIds. `caip2` is the
 * authoritative identifier (https://chainagnostic.org/CAIPs/caip-2).
 */

export type NonEvmChainSeed = {
  chainId: number;
  name: string;
  shortName: string;
  arch: 'solana' | 'move' | 'substrate' | 'ton' | 'tron' | 'stacks' | 'bitcoin' | 'other';
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
   * Hint used by the TVL join to look up DefiLlama. DefiLlama keys its
   * chains on `gecko_id` and `name`; we map to the DefiLlama display
   * name so resolution works.
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
        url: 'https://solana.drpc.org',
        operator: 'dRPC',
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
    ],
  },
];
